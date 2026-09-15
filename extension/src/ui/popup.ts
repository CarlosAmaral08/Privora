import { BrowserPageContentExtractor, DocumentLoadError } from "../services/contentExtractor";
import { getCurrentPage } from "../services/currentTab";
import {
  openDocumentAndContinueAnalysis,
  requestDocumentOriginAccess,
  takePendingDocumentAnalysis,
} from "../services/analysisContinuation";
import {
  BrowserPrivacyDocumentDiscovery,
  identifyCurrentDocument,
} from "../services/privacyDocumentDiscovery";
import type {
  AnalysisState,
  DiscoveredDocument,
  ExtractedPageContent,
  PageContext,
  PrivacyDocumentType,
} from "../types/analysis";

type Theme = "light" | "dark";

const THEME_KEY = "privora-extension-theme";
const MIN_RELEVANT_CHARACTERS = 300;
const PREVIEW_CHARACTERS = 720;
const DEFAULT_ALTERNATIVE_LIMIT = 3;
const DEFAULT_VISIBLE_CONFIDENCE = 0.68;
const contentExtractor = new BrowserPageContentExtractor();
const documentDiscovery = new BrowserPrivacyDocumentDiscovery();

const STATE_MESSAGES: Record<AnalysisState, string> = {
  idle: "Escolha o que deseja analisar",
  discovering: "Procurando documentos de privacidade…",
  analyzing: "Extraindo conteúdo do documento…",
  success: "Prévia local concluída",
  error: "Não foi possível concluir a análise",
  unsupported: "Página sem conteúdo adequado",
  "manual-required": "Política aberta em nova aba",
};

export function mountPopup(root: HTMLDivElement): void {
  let page: PageContext | null = null;
  let state: AnalysisState = "idle";
  let theme = readTheme();
  let documents: DiscoveredDocument[] = [];
  let selectedDocument: DiscoveredDocument | null = null;
  let showAllDocuments = false;
  let manualContinuationRequired = false;

  root.innerHTML = createShell();

  const themeButton = getElement<HTMLButtonElement>(root, "[data-theme-toggle]");
  const analyzeButton = getElement<HTMLButtonElement>(root, "[data-analyze]");
  const analyzeCurrentButton = getElement<HTMLButtonElement>(root, "[data-analyze-current]");
  const pageTitle = getElement<HTMLElement>(root, "[data-page-title]");
  const pageUrl = getElement<HTMLElement>(root, "[data-page-url]");
  const status = getElement<HTMLElement>(root, "[data-status]");
  const resultRegion = getElement<HTMLElement>(root, "[data-result]");

  applyTheme(theme, themeButton);
  renderDiscovering(resultRegion);

  themeButton.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme, themeButton);
  });

  analyzeButton.addEventListener("click", () => {
    if (state === "analyzing" || state === "discovering" || !page || !selectedDocument) return;
    analyzeSelectedDocumentFromClick(selectedDocument);
  });

  analyzeCurrentButton.addEventListener("click", async () => {
    if (state === "analyzing" || state === "discovering" || !page) return;
    await analyzeSource(undefined, true);
  });

  resultRegion.addEventListener("click", (event) => {
    const disclosureButton = (event.target as Element).closest<HTMLButtonElement>("[data-toggle-documents]");
    if (disclosureButton && state !== "analyzing" && page) {
      showAllDocuments = !showAllDocuments;
      renderDiscoveryResult(resultRegion, page, documents, selectedDocument, showAllDocuments);
      return;
    }

    const button = (event.target as Element).closest<HTMLButtonElement>("[data-document-index]");
    if (!button || state === "analyzing") return;
    const index = Number(button.dataset.documentIndex);
    if (!Number.isInteger(index) || !documents[index]) return;
    selectedDocument = documents[index];
    renderDiscoveryResult(resultRegion, page!, documents, selectedDocument, showAllDocuments);
    renderControls();
  });

  void loadCurrentPage();

  async function loadCurrentPage(): Promise<void> {
    try {
      const continuation = await takePendingDocumentAnalysis();
      if (continuation) {
        const pendingDocument = continuation.document;
        page = {
          tabId: continuation.tabId,
          title: pendingDocument.title,
          url: continuation.effectiveUrl,
          supported: true,
        };
        documents = [pendingDocument];
        selectedDocument = pendingDocument;
        pageTitle.textContent = pendingDocument.title;
        pageUrl.textContent = formatUrl(pendingDocument.url);
        pageUrl.title = pendingDocument.url;
        if (!continuation.requestedOriginAccess || continuation.crossOriginRedirectObserved) {
          showManualContinuationFallback();
          return;
        }
        await analyzeSource(pendingDocument, false, false, true);
        return;
      }

      page = await getCurrentPage();
      if (page.tabId !== undefined) {
        void Promise.all([
          chrome.action.setBadgeText({ tabId: page.tabId, text: "" }),
          chrome.action.setTitle({ tabId: page.tabId, title: "Abrir Privora" }),
        ]).catch(() => undefined);
      }
      pageTitle.textContent = page.title;
      pageUrl.textContent = formatUrl(page.url);
      pageUrl.title = page.url;

      if (!page.supported) {
        setState("unsupported");
        renderUnsupported(resultRegion, page.unsupportedReason ?? "Esta página não pode ser analisada.");
        renderControls();
        return;
      }

      setState("discovering");
      renderDiscovering(resultRegion);
      const discoveredLinks = await documentDiscovery.discover(page);
      const currentDocument = identifyCurrentDocument(page);
      documents = mergeDocuments(currentDocument, discoveredLinks);
      selectedDocument = documents[0] ?? null;
      showAllDocuments = false;
      setState("idle");
      renderDiscoveryResult(resultRegion, page, documents, selectedDocument, showAllDocuments);
      renderControls();
    } catch (error) {
      logError("Não foi possível carregar a página atual", error);
      pageTitle.textContent = "Página não identificada";
      pageUrl.textContent = "Abra uma página e tente novamente";
      setState("error");
      renderError(resultRegion);
      renderControls();
    }
  }

  function analyzeSelectedDocumentFromClick(document: DiscoveredDocument): void {
    if (!page) return;
    if (sameDocumentUrl(document.url, page.url)) {
      void analyzeSource(document, false);
      return;
    }

    let permissionRequest: Promise<boolean>;
    try {
      permissionRequest = requestDocumentOriginAccess(document.url);
    } catch (error) {
      logError("Não foi possível solicitar acesso ao site", error);
      setState("error");
      renderError(resultRegion);
      renderControls();
      return;
    }

    setState("analyzing");
    renderRequestingSiteAccess(resultRegion, document.url);
    renderControls();

    void permissionRequest
      .then((granted) => {
        if (!granted) {
          setState("error");
          renderPermissionDenied(resultRegion);
          renderControls();
          return;
        }
        void analyzeSource(document, false);
      })
      .catch((error: unknown) => {
        logError("Não foi possível solicitar acesso ao site", error);
        setState("error");
        renderPermissionDenied(resultRegion);
        renderControls();
      });
  }

  async function analyzeSource(
    document: DiscoveredDocument | undefined,
    forcedCurrentPage: boolean,
    allowContinuation = true,
    automaticContinuation = false,
  ): Promise<void> {
    if (!page) return;
    setState("analyzing");
    renderAnalyzing(resultRegion, document?.title);
    renderControls();

    let extractionCompleted = false;
    try {
      const content = forcedCurrentPage
        ? await contentExtractor.extractCurrentPage(page)
        : await contentExtractor.extractDocument(page, document!);
      extractionCompleted = true;
      if (!content.quality.suitable || content.relevantText.length < MIN_RELEVANT_CHARACTERS) {
        if (forcedCurrentPage) {
          setState("unsupported");
          renderUnsupported(
            resultRegion,
            content.quality.listingSignals > 0
              ? "A página parece ser predominantemente um feed, uma grade de cards ou uma listagem repetitiva, sem texto corrido suficiente para uma prévia confiável."
              : "Não encontramos texto corrido com densidade e estrutura suficientes para gerar uma prévia confiável.",
          );
          renderControls();
          return;
        }
        if (document && !sameDocumentUrl(document.url, page.url)) {
          if (allowContinuation) {
            continueAnalysisInNewTab(document);
          } else {
            setState("unsupported");
            renderUnsupported(
              resultRegion,
              "O documento aberto não possui texto principal suficiente para gerar uma prévia útil.",
            );
            renderControls();
          }
          return;
        }
        setState("unsupported");
        renderUnsupported(
          resultRegion,
          "O documento não possui texto principal suficiente em títulos, parágrafos ou listas para gerar uma prévia útil.",
        );
        renderControls();
        return;
      }

      setState("success");
      renderLocalPreview(resultRegion, content, Boolean(document), forcedCurrentPage);
      renderControls();
    } catch (error) {
      if (automaticContinuation && document && !extractionCompleted) {
        logError("A continuação automática não pôde executar a extração", error);
        showManualContinuationFallback();
        return;
      }
      if (error instanceof DocumentLoadError && document && allowContinuation) {
        continueAnalysisInNewTab({ ...document, url: error.documentUrl });
        return;
      }
      logError("Não foi possível extrair o conteúdo da página", error);
      setState("error");
      renderError(resultRegion);
      renderControls();
    }
  }

  function continueAnalysisInNewTab(document: DiscoveredDocument): void {
    setState("analyzing");
    renderContinuingAnalysis(resultRegion, document.url);
    renderControls();

    void openDocumentAndContinueAnalysis(document).catch((error: unknown) => {
      logError("Não foi possível abrir o documento em uma nova aba", error);
      setState("error");
      renderDocumentOpenAction(resultRegion, document.url);
      renderControls();
    });
  }

  function showManualContinuationFallback(): void {
    manualContinuationRequired = true;
    setState("manual-required");
    renderManualContinuationFallback(resultRegion);
    renderControls();
    if (page?.tabId !== undefined) {
      void Promise.all([
        chrome.action.setBadgeBackgroundColor({ tabId: page.tabId, color: "#7650f8" }),
        chrome.action.setBadgeText({ tabId: page.tabId, text: "1" }),
        chrome.action.setTitle({ tabId: page.tabId, title: "Política aberta — clique para continuar" }),
      ]).catch(() => undefined);
    }
  }

  function setState(nextState: AnalysisState): void {
    state = nextState;
    status.dataset.state = state;
    status.querySelector<HTMLElement>("[data-status-text]")!.textContent = STATE_MESSAGES[state];
    resultRegion.setAttribute("aria-busy", String(state === "analyzing" || state === "discovering"));
  }

  function renderControls(): void {
    if (manualContinuationRequired) {
      analyzeButton.hidden = true;
      analyzeButton.innerHTML = "";
      analyzeCurrentButton.hidden = true;
      return;
    }
    const isBusy = state === "analyzing" || state === "discovering";
    const canUsePage = Boolean(page?.supported);
    const canAnalyzeDocument = Boolean(selectedDocument && canUsePage);
    analyzeButton.hidden = !canAnalyzeDocument;
    analyzeButton.disabled = isBusy || !canUsePage;
    analyzeButton.innerHTML = canAnalyzeDocument ? primaryButtonLabel(state, selectedDocument!) : "";

    const currentIsSelected = Boolean(page && selectedDocument && sameDocumentUrl(page.url, selectedDocument.url));
    analyzeCurrentButton.hidden = !canUsePage || currentIsSelected || state === "success";
    analyzeCurrentButton.disabled = isBusy;
  }
}

function createShell(): string {
  return `
    <div class="popup-shell">
      <header class="product-header">
        <div class="brand" aria-label="Privora">
          <span class="brand-mark" aria-hidden="true"><i></i><i></i></span>
          <span>Privora</span>
        </div>
        <button class="theme-toggle" type="button" data-theme-toggle aria-pressed="false">
          <span class="theme-icon" aria-hidden="true">☀</span>
          <span data-theme-label>Claro</span>
        </button>
      </header>

      <main>
        <section class="page-context" aria-labelledby="current-page-label">
          <span class="eyebrow" id="current-page-label">Página atual</span>
          <div class="page-row">
            <span class="page-icon" aria-hidden="true">↗</span>
            <div>
              <h1 data-page-title>Identificando página…</h1>
              <p data-page-url>aguarde</p>
            </div>
          </div>
        </section>

        <section class="analysis-panel">
          <div class="status-row" data-status data-state="discovering" role="status">
            <span class="status-dot" aria-hidden="true"></span>
            <span data-status-text>Procurando documentos de privacidade…</span>
          </div>
          <button class="analyze-button" type="button" data-analyze hidden></button>
          <button class="secondary-action" type="button" data-analyze-current hidden>Analisar página atual mesmo assim</button>
          <p class="action-note">A leitura e eventual requisição à origem só começam quando você solicitar.</p>
        </section>

        <section class="result-region" data-result aria-live="polite" aria-busy="true"></section>
      </main>

      <footer><span aria-hidden="true"></span>Sem persistência de conteúdo, histórico, documentos ou dados de uso.</footer>
    </div>
  `;
}

function renderDiscovering(region: HTMLElement): void {
  region.innerHTML = `
    <div class="processing-state compact-processing">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Procurando políticas e termos</strong>
      <p>Somente texto, rótulos e endereços dos links desta página são inspecionados.</p>
    </div>
  `;
}

function renderDiscoveryResult(
  region: HTMLElement,
  page: PageContext,
  documents: DiscoveredDocument[],
  selected: DiscoveredDocument | null,
  showAll: boolean,
): void {
  if (documents.length === 0) {
    region.innerHTML = `
      <div class="message-state warning-state">
        <span aria-hidden="true">◇</span>
        <div><strong>Nenhum documento encontrado</strong><p>Não encontramos automaticamente uma política de privacidade neste site.</p></div>
      </div>
    `;
    return;
  }

  const currentDocument = documents.find((document) => sameDocumentUrl(document.url, page.url));
  const heading = currentDocument?.type === "privacy"
    ? "Esta página parece ser uma política de privacidade"
    : "Encontramos informações de privacidade neste site";
  const intro = currentDocument?.type === "privacy"
    ? "Você pode extrair este documento diretamente."
    : "Selecione o documento que deseja analisar.";
  const primaryDocument = currentDocument ?? documents[0];
  const alternatives = documents.filter((document) => document !== primaryDocument);
  const relevantAlternatives = alternatives.filter((document) => document.confidence >= DEFAULT_VISIBLE_CONFIDENCE);
  const defaultAlternatives = relevantAlternatives.slice(0, DEFAULT_ALTERNATIVE_LIMIT);
  const visibleAlternatives = showAll ? alternatives : defaultAlternatives;
  const hasHiddenDocuments = alternatives.length > defaultAlternatives.length;
  const primaryIndex = documents.indexOf(primaryDocument);

  region.innerHTML = `
    <div class="discovery-card">
      <div class="discovery-heading">
        <span class="discovery-badge"><i aria-hidden="true"></i> Descoberta local</span>
        <h2>${heading}</h2>
        <p>${intro}</p>
      </div>
      <div class="featured-document" role="listbox" aria-label="Documento principal">
        ${renderDocumentOption(primaryDocument, primaryIndex, selected, true)}
      </div>
      ${visibleAlternatives.length > 0 ? `
        <div class="alternative-documents">
          <strong class="document-group-label">Outros documentos</strong>
          <div class="document-list" role="listbox" aria-label="Outros documentos encontrados">
            ${visibleAlternatives.map((document) => renderDocumentOption(document, documents.indexOf(document), selected)).join("")}
          </div>
        </div>
      ` : ""}
      ${hasHiddenDocuments ? `
        <button class="document-disclosure" type="button" data-toggle-documents aria-expanded="${showAll}">
          ${showAll ? "Mostrar menos" : "Ver outros documentos"}
        </button>
      ` : ""}
      <p class="discovery-note">Priorizados por evidência documental, relação com o domínio e confiança.</p>
    </div>
  `;
}

function renderDocumentOption(
  document: DiscoveredDocument,
  index: number,
  selected: DiscoveredDocument | null,
  featured = false,
): string {
  const isSelected = selected?.url === document.url;
  return `
    <button class="document-option${featured ? " featured-document-option" : ""}" type="button" role="option" aria-selected="${isSelected}" data-document-index="${index}">
      <span class="document-type" data-type="${document.type}" aria-hidden="true">${documentTypeIcon(document.type)}</span>
      <span class="document-copy">
        <strong>${escapeHtml(document.title)}</strong>
        <small>${escapeHtml(formatUrl(document.url))}</small>
      </span>
      <span class="document-confidence" title="Confiança da descoberta">${Math.round(document.confidence * 100)}%</span>
    </button>
  `;
}

function renderAnalyzing(region: HTMLElement, documentTitle?: string): void {
  region.innerHTML = `
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>${documentTitle ? `Lendo ${escapeHtml(documentTitle)}` : "Lendo a página atual"}</strong>
      <p>O conteúdo existe somente em memória durante esta ação.</p>
      <div class="skeleton-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  `;
}

function renderDocumentOpenAction(region: HTMLElement, url: string): void {
  region.innerHTML = `
    <div class="message-state document-open-state">
      <span aria-hidden="true">↗</span>
      <div>
        <strong>Leitura direta indisponível</strong>
        <p>${escapeHtml(formatUrl(url))} não permitiu a leitura direta. A página atual foi preservada.</p>
        <a class="document-open-action" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">Abrir política em nova aba</a>
      </div>
    </div>
  `;
}

function renderContinuingAnalysis(region: HTMLElement, url: string): void {
  region.innerHTML = `
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Abrindo política e preparando análise…</strong>
      <p>${escapeHtml(formatUrl(url))} será aberto em uma nova aba. A leitura continuará automaticamente quando o documento carregar.</p>
    </div>
  `;
}

function renderManualContinuationFallback(region: HTMLElement): void {
  region.innerHTML = `
    <div class="message-state document-open-state">
      <span aria-hidden="true">↗</span>
      <div>
        <strong>Política aberta em nova aba</strong>
        <p>O navegador exige uma nova interação com a extensão nesta página.</p>
        <p><strong>Clique novamente no ícone da Privora para continuar a análise.</strong></p>
      </div>
    </div>
  `;
}

function renderRequestingSiteAccess(region: HTMLElement, url: string): void {
  region.innerHTML = `
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Preparando acesso ao documento</strong>
      <p>A solicitação será limitada a ${escapeHtml(formatOrigin(url))}.</p>
    </div>
  `;
}

function renderPermissionDenied(region: HTMLElement): void {
  region.innerHTML = `
    <div class="message-state warning-state">
      <span aria-hidden="true">◇</span>
      <div>
        <strong>Acesso ao site não concedido</strong>
        <p>A Privora precisa de acesso somente a este site para ler a política selecionada.</p>
      </div>
    </div>
  `;
}

function renderLocalPreview(
  region: HTMLElement,
  content: ExtractedPageContent,
  isPrivacyDocument: boolean,
  forcedCurrentPage: boolean,
): void {
  const characterCount = new Intl.NumberFormat("pt-BR").format(content.relevantText.length);
  const excerpt = content.relevantText.slice(0, PREVIEW_CHARACTERS).trim();
  const excerptSuffix = content.relevantText.length > PREVIEW_CHARACTERS ? "…" : "";
  const heading = forcedCurrentPage ? "Prévia da página atual" : "Documento pronto para análise local";
  const explanation = forcedCurrentPage
    ? "Este recorte foi solicitado manualmente e não classifica a página como conteúdo de privacidade."
    : isPrivacyDocument
      ? "A relevância vem dos sinais do documento selecionado, não da quantidade de texto."
      : "Conteúdo extraído localmente.";
  region.innerHTML = `
    <div class="result-heading local-result-heading">
      <span class="local-badge"><i aria-hidden="true"></i> Processamento local</span>
      <h2>${heading}</h2>
      <p>${explanation}</p>
    </div>
    <div class="local-preview">
      <div class="extraction-metric">
        <small>Texto extraído</small>
        <strong>≈ ${characterCount}</strong>
        <span>caracteres na prévia</span>
      </div>
      <dl class="preview-metadata">
        <div><dt>Título</dt><dd>${escapeHtml(content.title)}</dd></div>
        <div><dt>Origem</dt><dd title="${escapeHtml(content.sourceUrl)}">${escapeHtml(formatUrl(content.sourceUrl))}</dd></div>
      </dl>
      <div class="excerpt-block">
        <div><span>Trecho extraído</span><small>limitado para visualização</small></div>
        <p>${escapeHtml(excerpt)}${excerptSuffix}</p>
      </div>
      <div class="local-notice"><span aria-hidden="true">✓</span><strong>Nenhum conteúdo é enviado à Privora, backend, OpenRouter ou serviços de IA. O documento original pode ser requisitado diretamente de sua própria origem após sua ação explícita.</strong></div>
    </div>
    <a class="source-link" href="${escapeHtml(content.sourceUrl)}" target="_blank" rel="noreferrer">
      <span><small>Fonte original</small><strong>${escapeHtml(formatUrl(content.sourceUrl))}</strong></span>
      <i aria-hidden="true">↗</i>
    </a>
  `;
}

function renderUnsupported(region: HTMLElement, message: string): void {
  region.innerHTML = `
    <div class="message-state warning-state">
      <span aria-hidden="true">◇</span>
      <div><strong>Sem conteúdo adequado</strong><p>${escapeHtml(message)}</p></div>
    </div>
  `;
}

function renderError(region: HTMLElement): void {
  region.innerHTML = `
    <div class="message-state error-state">
      <span aria-hidden="true">!</span>
      <div><strong>Algo não saiu como esperado</strong><p>Não foi possível ler esta página. Verifique se ela permite execução de extensões e tente novamente.</p></div>
    </div>
  `;
}

function primaryButtonLabel(state: AnalysisState, document: DiscoveredDocument): string {
  if (state === "analyzing") return '<span class="button-spinner" aria-hidden="true"></span><span>Analisando…</span>';
  if (state === "discovering") return '<span class="button-spinner" aria-hidden="true"></span><span>Procurando…</span>';
  if (state === "success") return `<span>Analisar ${documentActionName(document.type)} novamente</span><span aria-hidden="true">↗</span>`;
  if (state === "unsupported" || state === "error") return `<span>Tentar analisar ${documentActionName(document.type)} novamente</span><span aria-hidden="true">↗</span>`;
  return `<span>Analisar ${documentActionName(document.type)}</span><span aria-hidden="true">↗</span>`;
}

function mergeDocuments(current: DiscoveredDocument | null, discovered: DiscoveredDocument[]): DiscoveredDocument[] {
  const unique = new Map<string, DiscoveredDocument>();
  const currentKey = current ? canonicalDocumentUrl(current.url) : null;
  for (const document of current ? [current, ...discovered] : discovered) {
    const key = canonicalDocumentUrl(document.url);
    if (current && key === currentKey) {
      unique.set(key, current);
      continue;
    }
    const previous = unique.get(key);
    if (!previous || document.confidence > previous.confidence) unique.set(key, document);
  }
  const priority: Record<PrivacyDocumentType, number> = { privacy: 4, terms: 3, cookies: 2, legal: 1 };
  return [...unique.values()].sort((left, right) => {
    const currentDifference = Number(sameDocumentUrl(right.url, current?.url ?? "")) - Number(sameDocumentUrl(left.url, current?.url ?? ""));
    if (currentDifference !== 0) return currentDifference;
    const confidenceDifference = right.confidence - left.confidence;
    if (confidenceDifference !== 0) return confidenceDifference;
    return priority[right.type] - priority[left.type];
  });
}

function documentActionName(type: PrivacyDocumentType): string {
  const labels: Record<PrivacyDocumentType, string> = {
    privacy: "política de privacidade",
    terms: "termos de serviço",
    cookies: "política de cookies",
    legal: "documento legal",
  };
  return labels[type];
}

function documentTypeIcon(type: PrivacyDocumentType): string {
  const icons: Record<PrivacyDocumentType, string> = { privacy: "P", terms: "T", cookies: "C", legal: "L" };
  return icons[type];
}

function readTheme(): Theme {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme, button: HTMLButtonElement): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  button.setAttribute("aria-pressed", String(theme === "dark"));
  button.setAttribute("aria-label", theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro");
  button.querySelector<HTMLElement>("[data-theme-label]")!.textContent = theme === "dark" ? "Escuro" : "Claro";
  button.querySelector<HTMLElement>(".theme-icon")!.textContent = theme === "dark" ? "☾" : "☀";

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // O toggle continua funcional durante a sessão mesmo sem armazenamento.
  }
}

function sameDocumentUrl(left: string, right: string): boolean {
  if (!left || !right) return false;
  return canonicalDocumentUrl(left) === canonicalDocumentUrl(right);
}

function canonicalDocumentUrl(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
    return `${url.origin}${pathname}${url.search}`;
  } catch {
    return value;
  }
}

function formatUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
  } catch {
    return value;
  }
}

function formatOrigin(value: string): string {
  try {
    return new URL(value).origin;
  } catch {
    return value;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character];
  });
}

function getElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Elemento obrigatório não encontrado: ${selector}`);
  return element;
}

function logError(context: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[Privora] ${context}: ${message}`);
}
