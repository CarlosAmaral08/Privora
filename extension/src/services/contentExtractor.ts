import type { ExtractedPageContent, PageContext } from "../types/analysis";

const MAX_EXTRACTED_CHARACTERS = 40_000;

/** Contrato para a extração explícita de conteúdo da aba ativa. */
export interface PageContentExtractor {
  extract(page: PageContext): Promise<ExtractedPageContent>;
}

/**
 * Extrai conteúdo somente quando chamado pela UI após o clique do usuário.
 * O texto retornado existe apenas em memória e não é persistido ou transmitido.
 */
export class BrowserPageContentExtractor implements PageContentExtractor {
  async extract(page: PageContext): Promise<ExtractedPageContent> {
    if (!page.tabId) {
      throw new Error("A aba atual não está disponível para extração.");
    }

    const [injection] = await chrome.scripting.executeScript<[number], ExtractedPageContent>({
      target: { tabId: page.tabId },
      func: extractVisiblePageContent,
      args: [MAX_EXTRACTED_CHARACTERS],
    });

    if (!injection?.result) {
      throw new Error("A página não retornou conteúdo extraível.");
    }

    return injection.result;
  }
}

/**
 * Esta função é serializada pelo Chromium e executada no contexto isolado da aba.
 * Por isso, todas as regras de leitura ficam autocontidas e sem dependências externas.
 */
function extractVisiblePageContent(maxCharacters: number): ExtractedPageContent {
  const relevantBlockSelector = "h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote";
  const ignoredSelector = [
    "script",
    "style",
    "noscript",
    "nav",
    "footer",
    "header",
    "aside",
    "form",
    "button",
    "input",
    "select",
    "textarea",
    "svg",
    "canvas",
    "iframe",
    "dialog",
    "[hidden]",
    '[aria-hidden="true"]',
    '[role="navigation"]',
    '[role="banner"]',
    '[role="contentinfo"]',
    '[class*="cookie-banner"]',
    '[class*="cookieBanner"]',
    '[class*="newsletter"]',
    '[class*="advertisement"]',
    '[class*="modal"]',
  ].join(",");
  const priorityRootSelectors = [
    "main",
    "article",
    '[role="main"]',
    '[id*="privacy" i]',
    '[class*="privacy" i]',
    '[id*="privacidade" i]',
    '[class*="privacidade" i]',
    '[id*="policy" i]',
    '[class*="policy" i]',
    '[id*="terms" i]',
    '[class*="terms" i]',
    '[id*="termos" i]',
    '[class*="termos" i]',
    '[id*="legal" i]',
    '[class*="legal" i]',
  ];

  const normalize = (value: string): string => value.replace(/\s+/g, " ").trim();
  const isVisible = (element: HTMLElement): boolean => {
    if (element.closest(ignoredSelector)) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
  };

  const roots: HTMLElement[] = [];
  const seenRoots = new Set<HTMLElement>();
  for (const selector of priorityRootSelectors) {
    for (const element of document.querySelectorAll<HTMLElement>(selector)) {
      if (!seenRoots.has(element) && isVisible(element)) {
        roots.push(element);
        seenRoots.add(element);
      }
    }
  }
  if (document.body && !seenRoots.has(document.body)) roots.push(document.body);

  const chunks: string[] = [];
  const seenElements = new Set<HTMLElement>();
  const seenText = new Set<string>();
  let currentLength = 0;

  extraction: for (const root of roots) {
    const elements = Array.from(root.querySelectorAll<HTMLElement>(relevantBlockSelector));
    if (root.matches(relevantBlockSelector)) elements.unshift(root);

    for (const element of elements) {
      if (seenElements.has(element) || !isVisible(element)) continue;
      seenElements.add(element);

      const text = normalize(element.innerText || element.textContent || "");
      const isHeading = /^H[1-6]$/.test(element.tagName);
      const minimumLength = isHeading ? 3 : 18;
      if (text.length < minimumLength) continue;

      const deduplicationKey = text.toLocaleLowerCase();
      if (seenText.has(deduplicationKey)) continue;
      seenText.add(deduplicationKey);

      const separatorLength = chunks.length === 0 ? 0 : 2;
      const remaining = maxCharacters - currentLength - separatorLength;
      if (remaining <= 0) break extraction;

      const chunk = text.slice(0, remaining).trim();
      if (!chunk) break extraction;
      chunks.push(chunk);
      currentLength += separatorLength + chunk.length;

      if (currentLength >= maxCharacters) break extraction;
    }
  }

  return {
    sourceUrl: window.location.href,
    title: normalize(document.title) || "Página sem título",
    relevantText: chunks.join("\n\n").slice(0, maxCharacters),
  };
}
