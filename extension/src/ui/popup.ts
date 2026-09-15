import { BrowserPageContentExtractor } from "../services/contentExtractor";
import { getCurrentPage, isLikelyPolicyPage } from "../services/currentTab";
import type { AnalysisState, ExtractedPageContent, PageContext } from "../types/analysis";

type Theme = "light" | "dark";

const THEME_KEY = "privora-extension-theme";
const MIN_RELEVANT_CHARACTERS = 300;
const PREVIEW_CHARACTERS = 720;
const contentExtractor = new BrowserPageContentExtractor();

const STATE_MESSAGES: Record<AnalysisState, string> = {
  idle: "Pronta para analisar esta página",
  analyzing: "Extraindo conteúdo visível da página…",
  success: "Prévia local concluída",
  error: "Não foi possível concluir a análise",
  unsupported: "Página sem conteúdo adequado",
};

export function mountPopup(root: HTMLDivElement): void {
  let page: PageContext | null = null;
  let state: AnalysisState = "idle";
  let theme = readTheme();

  root.innerHTML = createShell();

  const themeButton = getElement<HTMLButtonElement>(root, "[data-theme-toggle]");
  const analyzeButton = getElement<HTMLButtonElement>(root, "[data-analyze]");
  const pageTitle = getElement<HTMLElement>(root, "[data-page-title]");
  const pageUrl = getElement<HTMLElement>(root, "[data-page-url]");
  const status = getElement<HTMLElement>(root, "[data-status]");
  const resultRegion = getElement<HTMLElement>(root, "[data-result]");

  applyTheme(theme, themeButton);
  renderIdle(resultRegion);

  themeButton.addEventListener("click", () => {
    theme = theme === "light" ? "dark" : "light";
    applyTheme(theme, themeButton);
  });

  analyzeButton.addEventListener("click", async () => {
    if (state === "analyzing") return;
    if (!page) {
      await loadCurrentPage();
      return;
    }
    if (!page.supported) return;

    setState("analyzing");
    renderAnalyzing(resultRegion);

    try {
      const content = await contentExtractor.extract(page);
      if (content.relevantText.length < MIN_RELEVANT_CHARACTERS) {
        setState("unsupported");
        renderUnsupported(
          resultRegion,
          "A página não possui texto visível suficiente em títulos, parágrafos ou listas para gerar uma prévia útil.",
        );
        return;
      }

      setState("success");
      renderLocalPreview(resultRegion, content, isLikelyPolicyPage(page));
    } catch {
      setState("error");
      renderError(resultRegion);
    }
  });

  void loadCurrentPage();

  async function loadCurrentPage(): Promise<void> {
    try {
      page = await getCurrentPage();
      pageTitle.textContent = page.title;
      pageUrl.textContent = formatUrl(page.url);
      pageUrl.title = page.url;

      if (!page.supported) {
        setState("unsupported");
        renderUnsupported(resultRegion, page.unsupportedReason ?? "Esta página não pode ser analisada.");
      } else {
        setState("idle");
      }
    } catch {
      pageTitle.textContent = "Página não identificada";
      pageUrl.textContent = "Abra uma página e tente novamente";
      setState("error");
      renderError(resultRegion);
    }
  }

  function setState(nextState: AnalysisState): void {
    state = nextState;
    status.dataset.state = state;
    status.querySelector<HTMLElement>("[data-status-text]")!.textContent = STATE_MESSAGES[state];
    resultRegion.setAttribute("aria-busy", String(state === "analyzing"));
    analyzeButton.disabled = state === "analyzing" || state === "unsupported";
    analyzeButton.innerHTML = buttonLabel(state);
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
          <div class="status-row" data-status data-state="idle" role="status">
            <span class="status-dot" aria-hidden="true"></span>
            <span data-status-text>Pronta para analisar esta página</span>
          </div>
          <button class="analyze-button" type="button" data-analyze>
            <span>Analisar política</span><span aria-hidden="true">↗</span>
          </button>
          <p class="action-note">A análise só começa quando você solicitar.</p>
        </section>

        <section class="result-region" data-result aria-live="polite" aria-busy="false"></section>
      </main>

      <footer><span aria-hidden="true"></span>Nenhuma navegação passiva ou histórico.</footer>
    </div>
  `;
}

function renderIdle(region: HTMLElement): void {
  region.innerHTML = `
    <div class="empty-result">
      <span class="empty-mark" aria-hidden="true"><i></i><i></i></span>
      <div><strong>Sua prévia aparecerá aqui</strong><p>Um recorte técnico do texto visível, processado somente neste dispositivo.</p></div>
    </div>
  `;
}

function renderAnalyzing(region: HTMLElement): void {
  region.innerHTML = `
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Lendo a página atual</strong>
      <p>O script é executado somente nesta aba e somente após o seu clique.</p>
      <div class="skeleton-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  `;
}

function renderLocalPreview(region: HTMLElement, content: ExtractedPageContent, policyHint: boolean): void {
  const characterCount = new Intl.NumberFormat("pt-BR").format(content.relevantText.length);
  const excerpt = content.relevantText.slice(0, PREVIEW_CHARACTERS).trim();
  const excerptSuffix = content.relevantText.length > PREVIEW_CHARACTERS ? "…" : "";
  region.innerHTML = `
    <div class="result-heading local-result-heading">
      <span class="local-badge"><i aria-hidden="true"></i> Processamento local</span>
      <h2>Conteúdo pronto para análise</h2>
      <p>${policyHint ? "A URL ou o título também apresentam sinais de conteúdo sobre privacidade." : "O texto útil foi encontrado mesmo sem palavras-chave no título ou na URL."}</p>
    </div>
    <div class="local-preview">
      <div class="extraction-metric">
        <small>Texto extraído</small>
        <strong>≈ ${characterCount}</strong>
        <span>caracteres úteis</span>
      </div>
      <dl class="preview-metadata">
        <div><dt>Título</dt><dd>${escapeHtml(content.title)}</dd></div>
        <div><dt>Origem</dt><dd title="${escapeHtml(content.sourceUrl)}">${escapeHtml(formatUrl(content.sourceUrl))}</dd></div>
      </dl>
      <div class="excerpt-block">
        <div><span>Trecho extraído</span><small>limitado para visualização</small></div>
        <p>${escapeHtml(excerpt)}${excerptSuffix}</p>
      </div>
      <div class="local-notice"><span aria-hidden="true">✓</span><strong>Prévia local — nenhum conteúdo foi enviado para a Privora.</strong></div>
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
      <div><strong>Algo não saiu como esperado</strong><p>Não foi possível ler o conteúdo desta página. Verifique se ela permite execução de extensões e tente novamente.</p></div>
    </div>
  `;
}

function buttonLabel(state: AnalysisState): string {
  if (state === "analyzing") return '<span class="button-spinner" aria-hidden="true"></span><span>Analisando…</span>';
  if (state === "success") return '<span>Extrair novamente</span><span aria-hidden="true">↗</span>';
  if (state === "error") return '<span>Tentar novamente</span><span aria-hidden="true">↗</span>';
  if (state === "unsupported") return "<span>Análise indisponível</span>";
  return '<span>Analisar política</span><span aria-hidden="true">↗</span>';
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

function formatUrl(value: string): string {
  try {
    const url = new URL(value);
    return `${url.hostname}${url.pathname === "/" ? "" : url.pathname}`;
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
