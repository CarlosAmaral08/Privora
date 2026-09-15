import type { DiscoveredDocument } from "../types/analysis";
import { documentOriginPattern } from "../services/hostPermission";
import type {
  OpenDocumentForAnalysisMessage,
  OpenDocumentForAnalysisResponse,
  PendingDocumentAnalysis,
} from "../types/continuation";

const PENDING_TTL_MS = 2 * 60 * 1_000;
const PENDING_ANALYSIS_PREFIX = "privora-pending-analysis:";
const STABILIZATION_INTERVAL_MS = 300;
const STABLE_COMPLETE_SNAPSHOTS = 3;
const MAX_STABILIZATION_SNAPSHOTS = 8;
const readinessChecks = new Set<number>();
const pendingTabIds = new Set<number>();
const pendingTabsRestored = restorePendingTabIds();

chrome.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !isOpenDocumentMessage(message)) return false;

  void startDocumentContinuation(message.document)
    .then(() => sendResponse({ ok: true } satisfies OpenDocumentForAnalysisResponse))
    .catch((error: unknown) => {
      logError("Não foi possível iniciar a continuação", error);
      const detail = error instanceof Error ? error.message : "Falha desconhecida.";
      sendResponse({ ok: false, error: detail } satisfies OpenDocumentForAnalysisResponse);
    });
  return true;
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  void pendingTabsRestored.then(async () => {
    if (!pendingTabIds.has(tabId)) return;

    let pending = await getPending(tabId);
    if (!pending) {
      pendingTabIds.delete(tabId);
      return;
    }

    if (changeInfo.url) {
      const observedOriginPattern = safeOriginPattern(changeInfo.url);
      pending = {
        ...pending,
        observedUrl: changeInfo.url,
        crossOriginRedirectObserved: pending.crossOriginRedirectObserved === true || (
          observedOriginPattern !== null && observedOriginPattern !== pending.requestedOriginPattern
        ),
      };
      await chrome.storage.session.set({ [pendingKey(tabId)]: pending });
    }

    if (changeInfo.status === "complete") void stabilizePendingAnalysis(tabId);
  });
});

chrome.tabs.onRemoved.addListener((tabId) => {
  void pendingTabsRestored.then(async () => {
    if (!pendingTabIds.delete(tabId)) return;
    await chrome.storage.session.remove(pendingKey(tabId));
  });
});

async function startDocumentContinuation(document: DiscoveredDocument): Promise<void> {
  const url = validatedDocumentUrl(document.url);
  const origin = documentOriginPattern(url);
  const hasOriginAccess = await chrome.permissions.contains({ origins: [origin] });
  if (!hasOriginAccess) throw new Error("O acesso ao site selecionado não foi concedido.");
  await removeExpiredPendingAnalyses();

  const tab = await chrome.tabs.create({ active: true, url });
  if (tab.id === undefined) throw new Error("O navegador não retornou a nova aba.");

  const pending: PendingDocumentAnalysis = {
    document: { ...document, url },
    createdAt: Date.now(),
    createdByExtension: true,
    status: "loading",
    requestedOriginPattern: origin,
  };
  await chrome.storage.session.set({ [pendingKey(tab.id)]: pending });
  pendingTabIds.add(tab.id);

  const openedTab = await chrome.tabs.get(tab.id);
  if (openedTab.status === "complete") void stabilizePendingAnalysis(tab.id);

  setTimeout(() => {
    void removePendingIfExpired(tab.id!);
  }, PENDING_TTL_MS);
}

async function stabilizePendingAnalysis(tabId: number): Promise<void> {
  if (readinessChecks.has(tabId)) return;
  readinessChecks.add(tabId);

  try {
    const pending = await getPending(tabId);
    if (!pending) {
      pendingTabIds.delete(tabId);
      return;
    }
    if (pending.status !== "loading") return;
    if (Date.now() - pending.createdAt > PENDING_TTL_MS) {
      await chrome.storage.session.remove(pendingKey(tabId));
      pendingTabIds.delete(tabId);
      return;
    }

    let lastCompleteUrl: string | undefined;
    let stableCompleteSnapshots = 0;

    for (let snapshot = 1; snapshot <= MAX_STABILIZATION_SNAPSHOTS; snapshot += 1) {
      const tab = await chrome.tabs.get(tabId);
      const sameCompleteUrl = tab.status === "complete" && tab.url === lastCompleteUrl;
      stableCompleteSnapshots = sameCompleteUrl ? stableCompleteSnapshots + 1 : tab.status === "complete" ? 1 : 0;
      lastCompleteUrl = tab.status === "complete" ? tab.url : undefined;

      if (stableCompleteSnapshots >= STABLE_COMPLETE_SNAPSHOTS) {
        const latestPending = await getPending(tabId);
        if (!latestPending) {
          pendingTabIds.delete(tabId);
          return;
        }
        await markPendingAnalysisReady(tabId, tab, latestPending);
        return;
      }
      if (snapshot < MAX_STABILIZATION_SNAPSHOTS) await delay(STABILIZATION_INTERVAL_MS);
    }
  } catch (error) {
    logError("Falha ao preparar a aba da política", error);
  } finally {
    readinessChecks.delete(tabId);
  }
}

async function markPendingAnalysisReady(
  tabId: number,
  finalTab: chrome.tabs.Tab,
  pending: PendingDocumentAnalysis,
): Promise<void> {
  const requestedOriginAccess = await chrome.permissions.contains({ origins: [pending.requestedOriginPattern] });
  const observedOriginPattern = safeOriginPattern(finalTab.url ?? pending.observedUrl);
  const crossOriginRedirectObserved = pending.crossOriginRedirectObserved === true || (
    observedOriginPattern !== null && observedOriginPattern !== pending.requestedOriginPattern
  );
  const canTrustPendingUrl = pending.createdByExtension && !finalTab.url &&
    !crossOriginRedirectObserved && requestedOriginAccess;
  const effectiveUrl = finalTab.url ?? (canTrustPendingUrl ? pending.document.url : undefined);

  const readyPending: PendingDocumentAnalysis = {
    ...pending,
    status: "ready",
    crossOriginRedirectObserved,
    finalUrl: finalTab.url,
    effectiveUrl,
  };
  await chrome.storage.session.set({ [pendingKey(tabId)]: readyPending });
  await chrome.action.setBadgeBackgroundColor({ tabId, color: "#7650f8" });
  await chrome.action.setBadgeText({ tabId, text: "…" });
  await chrome.action.setTitle({ tabId, title: "Análise iniciada — abrindo Privora" });

  try {
    await chrome.action.openPopup({ windowId: finalTab.windowId });
  } catch (error) {
    logError("Não foi possível abrir o popup automaticamente", error);
    await chrome.action.setBadgeText({ tabId, text: "1" });
    await chrome.action.setTitle({ tabId, title: "Política aberta — clique para continuar" });
  }
}

async function removeExpiredPendingAnalyses(): Promise<void> {
  const stored = await chrome.storage.session.get(null);
  const expiredKeys = Object.entries(stored)
    .filter(([key, value]) => key.startsWith(PENDING_ANALYSIS_PREFIX) && isExpiredPending(value))
    .map(([key]) => key);
  if (expiredKeys.length === 0) return;

  await chrome.storage.session.remove(expiredKeys);
  for (const key of expiredKeys) pendingTabIds.delete(tabIdFromPendingKey(key));
}

async function removePendingIfExpired(tabId: number): Promise<void> {
  const key = pendingKey(tabId);
  const stored = await chrome.storage.session.get(key);
  if (!isExpiredPending(stored[key])) return;

  await chrome.storage.session.remove(key);
  pendingTabIds.delete(tabId);
}

async function restorePendingTabIds(): Promise<void> {
  const stored = await chrome.storage.session.get(null);
  for (const [key, value] of Object.entries(stored)) {
    if (!key.startsWith(PENDING_ANALYSIS_PREFIX) || isExpiredPending(value)) continue;
    const tabId = tabIdFromPendingKey(key);
    if (Number.isInteger(tabId)) pendingTabIds.add(tabId);
  }
  await removeExpiredPendingAnalyses();
}

async function getPending(tabId: number): Promise<PendingDocumentAnalysis | undefined> {
  const key = pendingKey(tabId);
  const stored = await chrome.storage.session.get(key);
  return stored[key] as PendingDocumentAnalysis | undefined;
}

function isExpiredPending(value: unknown): boolean {
  if (!value || typeof value !== "object" || !("createdAt" in value)) return false;
  return typeof value.createdAt === "number" && Date.now() - value.createdAt >= PENDING_TTL_MS;
}

function isOpenDocumentMessage(message: unknown): message is OpenDocumentForAnalysisMessage {
  if (!message || typeof message !== "object" || !("type" in message) || !("document" in message)) return false;
  if (message.type !== "open-document-for-analysis" || !message.document || typeof message.document !== "object") return false;
  const document = message.document as Partial<DiscoveredDocument>;
  const validTypes = new Set(["privacy", "terms", "cookies", "legal"]);
  return typeof document.url === "string" && typeof document.title === "string" &&
    typeof document.type === "string" && validTypes.has(document.type) &&
    typeof document.confidence === "number" && Number.isFinite(document.confidence);
}

function validatedDocumentUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Apenas documentos HTTP ou HTTPS podem ser abertos.");
  }
  return url.href;
}

function safeOriginPattern(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return documentOriginPattern(value);
  } catch {
    return null;
  }
}

function pendingKey(tabId: number): string {
  return `${PENDING_ANALYSIS_PREFIX}${tabId}`;
}

function tabIdFromPendingKey(key: string): number {
  return Number(key.slice(PENDING_ANALYSIS_PREFIX.length));
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Privora] ${context}: ${message}`);
}
