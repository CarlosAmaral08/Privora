import { runTemporaryMockAnalysis } from "../mocks/mockAnalysis";
import { getCurrentPage } from "../services/currentTab";
import type { AnalysisResult, AnalysisState, PageContext } from "../types/analysis";

type Theme = "light" | "dark";

const THEME_KEY = "privora-extension-theme";

const STATE_MESSAGES: Record<AnalysisState, string> = {
  idle: "Pronta para analisar esta página",
  analyzing: "Analisando estrutura da política…",
  success: "Resumo demonstrativo concluído",
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
      const result = await runTemporaryMockAnalysis(page);
      if (!result) {
        setState("unsupported");
        renderUnsupported(
          resultRegion,
          "Não encontramos indícios de uma política, termos ou conteúdo de privacidade nesta página.",
        );
        return;
      }

      setState("success");
      renderSuccess(resultRegion, result);
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
      <div><strong>Seu resumo aparecerá aqui</strong><p>Dados, finalidades e controles organizados em uma leitura simples.</p></div>
    </div>
  `;
}

function renderAnalyzing(region: HTMLElement): void {
  region.innerHTML = `
    <div class="processing-state">
      <span class="processing-orbit" aria-hidden="true"><i></i></span>
      <strong>Preparando a estrutura</strong>
      <p>Esta etapa usa uma espera simulada para validar a interface.</p>
      <div class="skeleton-lines" aria-hidden="true"><span></span><span></span><span></span></div>
    </div>
  `;
}

function renderSuccess(region: HTMLElement, result: AnalysisResult): void {
  const sections = result.sections
    .map(
      (section, index) => `
        <details class="result-section" ${index === 0 ? "open" : ""}>
          <summary><span class="section-number">0${index + 1}</span><span>${escapeHtml(section.title)}</span><i aria-hidden="true">+</i></summary>
          <div class="section-content">
            <p>${escapeHtml(section.summary)}</p>
            <ul>${section.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>
          </div>
        </details>
      `,
    )
    .join("");

  region.innerHTML = `
    <div class="result-heading">
      <span class="mock-badge"><i aria-hidden="true"></i> Resultado mock</span>
      <h2>Política em perspectiva</h2>
      <p>${escapeHtml(result.summary)}</p>
      <small>Simulação visual — nenhuma IA ou análise real foi executada.</small>
    </div>
    <div class="result-sections">${sections}</div>
    <a class="source-link" href="${escapeHtml(result.sourceUrl)}" target="_blank" rel="noreferrer">
      <span><small>Fonte original</small><strong>${escapeHtml(formatUrl(result.sourceUrl))}</strong></span>
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
      <div><strong>Algo não saiu como esperado</strong><p>Não foi possível preparar a simulação desta página. Feche o popup e tente novamente.</p></div>
    </div>
  `;
}

function buttonLabel(state: AnalysisState): string {
  if (state === "analyzing") return '<span class="button-spinner" aria-hidden="true"></span><span>Analisando…</span>';
  if (state === "success") return '<span>Analisar novamente</span><span aria-hidden="true">↗</span>';
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
