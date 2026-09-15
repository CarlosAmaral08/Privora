import type { DiscoveredDocument } from "../types/analysis";
import type {
  OpenDocumentForAnalysisMessage,
  OpenDocumentForAnalysisResponse,
  PendingDocumentAnalysis,
} from "../types/continuation";
import { documentOriginPattern } from "./hostPermission";

export const PENDING_ANALYSIS_PREFIX = "privora-pending-analysis:";

export interface TakenPendingDocumentAnalysis {
  document: DiscoveredDocument;
  tabId: number;
  effectiveUrl: string;
  requestedOriginAccess: boolean;
  crossOriginRedirectObserved: boolean;
}

export function requestDocumentOriginAccess(documentUrl: string): Promise<boolean> {
  const origin = documentOriginPattern(documentUrl);
  return chrome.permissions.request({ origins: [origin] });
}

export async function openDocumentAndContinueAnalysis(document: DiscoveredDocument): Promise<void> {
  const message: OpenDocumentForAnalysisMessage = {
    type: "open-document-for-analysis",
    document,
  };
  const response = await chrome.runtime.sendMessage<OpenDocumentForAnalysisResponse>(message);
  if (!response?.ok) {
    throw new Error(response?.error ?? "Não foi possível abrir o documento para continuar a análise.");
  }
}

export async function takePendingDocumentAnalysis(): Promise<TakenPendingDocumentAnalysis | null> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query || !chrome.storage?.session) return null;
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (activeTab?.id === undefined) return null;

  const tabId = activeTab.id;
  const key = `${PENDING_ANALYSIS_PREFIX}${tabId}`;
  const stored = await chrome.storage.session.get(key);
  const pending = stored[key] as PendingDocumentAnalysis | undefined;
  if (!pending || pending.status !== "ready") return null;

  const requestedOriginAccess = await chrome.permissions.contains({ origins: [pending.requestedOriginPattern] });
  const crossOriginRedirectObserved = pending.crossOriginRedirectObserved === true;
  const canTrustPendingUrl = pending.createdByExtension && !activeTab.url && !pending.finalUrl &&
    !crossOriginRedirectObserved && requestedOriginAccess;
  const effectiveUrl = pending.effectiveUrl ?? (
    canTrustPendingUrl ? pending.document.url : pending.finalUrl ?? pending.document.url
  );

  await chrome.storage.session.remove(key);
  await Promise.all([
    chrome.action.setBadgeText({ tabId, text: "" }),
    chrome.action.setTitle({ tabId, title: "Abrir Privora" }),
  ]);
  return {
    document: pending.document,
    tabId,
    effectiveUrl,
    requestedOriginAccess,
    crossOriginRedirectObserved,
  };
}
