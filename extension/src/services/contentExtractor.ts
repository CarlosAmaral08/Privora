import type { DiscoveredDocument, ExtractedPageContent, PageContext } from "../types/analysis";

const MAX_EXTRACTED_CHARACTERS = 40_000;

/** Contrato para a extração explícita de conteúdo da aba ativa. */
export interface PageContentExtractor {
  extractDocument(page: PageContext, document: DiscoveredDocument): Promise<ExtractedPageContent>;
  extractCurrentPage(page: PageContext): Promise<ExtractedPageContent>;
}

export class DocumentLoadError extends Error {
  constructor(readonly documentUrl: string, options?: ErrorOptions) {
    super("O documento não pôde ser lido sem sair da aba atual.", options);
    this.name = "DocumentLoadError";
  }
}

/**
 * Extrai conteúdo somente quando chamado pela UI após o clique do usuário.
 * O texto retornado existe apenas em memória na extensão. Após a ação explícita
 * do usuário, o popup pode enviá-lo ao backend da Privora para análise.
 */
export class BrowserPageContentExtractor implements PageContentExtractor {
  async extractDocument(page: PageContext, document: DiscoveredDocument): Promise<ExtractedPageContent> {
    if (!page.tabId) {
      throw new Error("A aba atual não está disponível para extração.");
    }

    const sourceUrl = document.url;
    if (!isSameDocument(sourceUrl, page.url)) {
      try {
        const [remoteInjection] = await chrome.scripting.executeScript<[string, number], ExtractedPageContent>({
          target: { tabId: page.tabId },
          func: fetchAndExtractDocument,
          args: [sourceUrl, MAX_EXTRACTED_CHARACTERS],
        });

        if (remoteInjection?.result) return remoteInjection.result;
      } catch (error) {
        throw new DocumentLoadError(sourceUrl, { cause: error });
      }
      throw new DocumentLoadError(sourceUrl);
    }

    const [injection] = await chrome.scripting.executeScript<[number], ExtractedPageContent>({
      target: { tabId: page.tabId },
      func: extractDocumentPageContent,
      args: [MAX_EXTRACTED_CHARACTERS],
    });

    if (!injection?.result) {
      throw new Error("A página não retornou conteúdo extraível.");
    }

    return injection.result;
  }

  async extractCurrentPage(page: PageContext): Promise<ExtractedPageContent> {
    if (!page.tabId) {
      throw new Error("A aba atual não está disponível para extração.");
    }

    const [injection] = await chrome.scripting.executeScript<[number], ExtractedPageContent>({
      target: { tabId: page.tabId },
      func: extractManualPageContent,
      args: [MAX_EXTRACTED_CHARACTERS],
    });

    if (!injection?.result) {
      throw new Error("A página não retornou conteúdo extraível.");
    }

    return injection.result;
  }
}

function isSameDocument(left: string, right: string): boolean {
  try {
    const normalize = (value: string): string => {
      const url = new URL(value);
      url.hash = "";
      return url.href;
    };
    return normalize(left) === normalize(right);
  } catch {
    return left === right;
  }
}

/**
 * Esta função é serializada pelo Chromium e executada no contexto isolado da aba.
 * Por isso, todas as regras de leitura ficam autocontidas e sem dependências externas.
 */
function extractDocumentPageContent(maxCharacters: number): ExtractedPageContent {
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

  const relevantText = chunks.join("\n\n").slice(0, maxCharacters);
  const bodyTextLength = normalize(document.body?.innerText ?? "").length;
  const anchorTextLength = Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .reduce((total, anchor) => total + normalize(anchor.innerText || anchor.textContent || "").length, 0);

  return {
    sourceUrl: window.location.href,
    title: normalize(document.title) || "Página sem título",
    relevantText,
    quality: {
      strategy: "document",
      suitable: relevantText.length >= 300 && chunks.length >= 2,
      textDensity: bodyTextLength > 0 ? Math.min(1, relevantText.length / bodyTextLength) : 0,
      anchorTextRatio: bodyTextLength > 0 ? Math.min(1, anchorTextLength / bodyTextLength) : 0,
      substantialBlocks: chunks.length,
      listingSignals: 0,
    },
  };
}

/**
 * Extrai manualmente uma página comum com critérios conservadores. A heurística
 * procura prosa substancial e rejeita regiões que se comportam como feeds,
 * grades, menus ou coleções de cards, independentemente do domínio visitado.
 */
function extractManualPageContent(maxCharacters: number): ExtractedPageContent {
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
    '[role="feed"]',
    '[role="grid"]',
    '[role="listbox"]',
    '[role="menu"]',
  ].join(",");
  const blockSelector = "h1, h2, h3, h4, h5, h6, p, blockquote, li";
  const normalize = (value: string): string => value.replace(/\s+/g, " ").trim();
  const wordCount = (value: string): number => value.split(/\s+/).filter(Boolean).length;
  const ratio = (part: number, whole: number): number => whole > 0 ? Math.min(1, part / whole) : 0;
  const round = (value: number): number => Math.round(value * 100) / 100;
  const isVisible = (element: HTMLElement): boolean => {
    if (element.closest(ignoredSelector)) return false;
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0" && element.getClientRects().length > 0;
  };
  const elementText = (element: HTMLElement): string => normalize(element.innerText || element.textContent || "");
  const anchorTextLength = (element: HTMLElement): number =>
    Array.from(element.querySelectorAll<HTMLAnchorElement>("a[href]"))
      .reduce((total, anchor) => total + normalize(anchor.innerText || anchor.textContent || "").length, 0);
  const childSignature = (element: Element): string => {
    const role = element.getAttribute("role") ?? "";
    const stableClasses = Array.from(element.classList).slice(0, 2).sort().join(".");
    return `${element.tagName}:${role}:${stableClasses}`;
  };

  type Block = { text: string; kind: "heading" | "prose" | "list" };
  type Candidate = {
    relevantText: string;
    textDensity: number;
    anchorRatio: number;
    substantialBlocks: number;
    listingSignals: number;
    suitable: boolean;
    score: number;
  };

  const evaluateRoot = (root: HTMLElement): Candidate => {
    const rootText = elementText(root);
    const rootTextLength = rootText.length;
    const rootAnchors = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]")).filter(isVisible);
    const rootAnchorTextLength = rootAnchors.reduce(
      (total, anchor) => total + normalize(anchor.innerText || anchor.textContent || "").length,
      0,
    );
    const rootAnchorRatio = ratio(rootAnchorTextLength, rootTextLength);
    const shortLinks = rootAnchors.filter((anchor) => {
      const text = normalize(anchor.innerText || anchor.textContent || "");
      return text.length > 0 && text.length <= 70;
    }).length;
    const listingCache = new WeakMap<HTMLElement, boolean>();
    const parent = root.parentElement;
    const repeatedRoot = (() => {
      if (!parent) return false;
      const siblings = Array.from(parent.children).filter((child): child is HTMLElement => child instanceof HTMLElement && isVisible(child));
      const matchingSiblings = siblings.filter((sibling) => childSignature(sibling) === childSignature(root));
      if (matchingSiblings.length < 4 || matchingSiblings.length / siblings.length < 0.6) return false;
      const averageSiblingText = matchingSiblings.reduce((total, sibling) => total + elementText(sibling).length, 0) / matchingSiblings.length;
      const parentTextLength = elementText(parent).length;
      const parentAnchorRatio = ratio(anchorTextLength(parent), parentTextLength);
      return averageSiblingText < 350 || (averageSiblingText < 700 && parentAnchorRatio >= 0.12);
    })();

    const isListingContainer = (container: HTMLElement): boolean => {
      const cached = listingCache.get(container);
      if (cached !== undefined) return cached;

      if (container.matches('[role="feed"], [role="grid"], [role="listbox"], [role="menu"]')) {
        listingCache.set(container, true);
        return true;
      }

      const children = Array.from(container.children).filter((child): child is HTMLElement => child instanceof HTMLElement && isVisible(child));
      if (children.length < 4) {
        listingCache.set(container, false);
        return false;
      }

      const signatureCounts = new Map<string, number>();
      for (const child of children) {
        const signature = childSignature(child);
        signatureCounts.set(signature, (signatureCounts.get(signature) ?? 0) + 1);
      }
      const repeatedChildren = Math.max(0, ...signatureCounts.values());
      const repetitionRatio = repeatedChildren / children.length;
      const childTextLengths = children.map((child) => elementText(child).length);
      const averageChildText = childTextLengths.reduce((sum, length) => sum + length, 0) / children.length;
      const containerTextLength = elementText(container).length;
      const containerAnchorRatio = ratio(anchorTextLength(container), containerTextLength);
      const headingChildren = children.filter((child) => child.matches("h1, h2, h3, h4, h5, h6") || Boolean(child.querySelector("h1, h2, h3, h4, h5, h6"))).length;
      const looksRepeated = repetitionRatio >= 0.6 && repeatedChildren >= 4;
      const looksLikeCards = looksRepeated && (
        (averageChildText < 500 && containerAnchorRatio >= 0.2) ||
        (averageChildText < 180 && headingChildren >= Math.ceil(children.length / 2))
      );

      listingCache.set(container, looksLikeCards);
      return looksLikeCards;
    };

    const isInsideListing = (element: HTMLElement): boolean => {
      let ancestor = element.parentElement;
      while (ancestor && ancestor !== root) {
        if (isListingContainer(ancestor)) return true;
        ancestor = ancestor.parentElement;
      }
      return isListingContainer(root);
    };

    const blocks: Block[] = [];
    const seenText = new Set<string>();
    let rejectedListingBlocks = 0;
    let rejectedLinkHeavyBlocks = 0;
    let proseCharacters = 0;
    let proseBlocks = 0;
    let listCharacters = 0;
    let listBlocks = 0;
    let shortHeadings = 0;

    for (const element of Array.from(root.querySelectorAll<HTMLElement>(blockSelector)).slice(0, 1_200)) {
      if (!isVisible(element)) continue;
      if (element.matches("li") && element.querySelector("p, blockquote")) continue;

      const text = elementText(element);
      const words = wordCount(text);
      const isHeading = /^H[1-6]$/.test(element.tagName);
      const isListItem = element.matches("li");
      const minimumLength = isHeading ? 5 : isListItem ? 90 : 70;
      const minimumWords = isHeading ? 2 : isListItem ? 12 : 10;
      if (text.length < minimumLength || words < minimumWords) continue;
      if (isHeading && text.length <= 90) shortHeadings += 1;

      const key = text.toLocaleLowerCase();
      if (seenText.has(key)) continue;
      seenText.add(key);

      if (isInsideListing(element)) {
        rejectedListingBlocks += 1;
        continue;
      }

      const blockAnchorRatio = ratio(anchorTextLength(element), text.length);
      if (blockAnchorRatio > (isHeading ? 0.7 : 0.45)) {
        rejectedLinkHeavyBlocks += 1;
        continue;
      }

      if (isHeading) {
        blocks.push({ text: text.slice(0, 180), kind: "heading" });
      } else if (isListItem) {
        blocks.push({ text, kind: "list" });
        listCharacters += text.length;
        listBlocks += 1;
      } else {
        blocks.push({ text, kind: "prose" });
        proseCharacters += text.length;
        proseBlocks += 1;
      }
    }

    const hasDocumentaryProse =
      (proseCharacters >= 240 && proseBlocks >= 2) ||
      (proseCharacters >= 100 && proseBlocks >= 1 && listCharacters >= 180 && listBlocks >= 2);
    const selectedBlocks = blocks.filter((block) => block.kind !== "heading" || hasDocumentaryProse);
    const chunks: string[] = [];
    let currentLength = 0;
    for (const block of selectedBlocks) {
      const separatorLength = chunks.length === 0 ? 0 : 2;
      const remaining = maxCharacters - currentLength - separatorLength;
      if (remaining <= 0) break;
      const chunk = block.text.slice(0, remaining).trim();
      if (!chunk) break;
      chunks.push(chunk);
      currentLength += separatorLength + chunk.length;
    }

    const relevantText = chunks.join("\n\n");
    const textDensity = ratio(relevantText.length, rootTextLength);
    const evaluatedBlocks = selectedBlocks.length + rejectedListingBlocks + rejectedLinkHeavyBlocks;
    const rejectedRatio = ratio(rejectedListingBlocks + rejectedLinkHeavyBlocks, evaluatedBlocks);
    const headingsDominate = shortHeadings >= 6 && proseBlocks + listBlocks < Math.ceil(shortHeadings / 2);
    const linkCollection = shortLinks >= 8 && rootAnchorRatio >= 0.3;
    const repeatedCollection = rejectedListingBlocks >= 4 && rejectedRatio >= 0.45;
    const lowDensityCollection = rootTextLength >= 1_000 && textDensity < 0.12 && (shortLinks >= 8 || rejectedListingBlocks >= 4);
    const listingSignals = Number(repeatedRoot) + Number(headingsDominate) + Number(linkCollection) + Number(repeatedCollection) + Number(lowDensityCollection);
    const suitable = relevantText.length >= 300 && hasDocumentaryProse && textDensity >= 0.08 && listingSignals === 0;
    const score =
      proseCharacters + listCharacters * 0.55 + proseBlocks * 190 + textDensity * 1_600 -
      listingSignals * 2_000 - rejectedListingBlocks * 75 - rootAnchorRatio * 900;

    return {
      relevantText,
      textDensity,
      anchorRatio: rootAnchorRatio,
      substantialBlocks: selectedBlocks.length,
      listingSignals,
      suitable,
      score,
    };
  };

  const candidateRoots: HTMLElement[] = [];
  const seenRoots = new Set<HTMLElement>();
  const addCandidate = (root: HTMLElement): void => {
    if (!seenRoots.has(root) && isVisible(root)) {
      candidateRoots.push(root);
      seenRoots.add(root);
    }
  };
  const semanticRootSelectors = [
    "article",
    '[itemprop="articleBody"]',
    '[class*="article-content" i]',
    '[class*="article_content" i]',
    '[class*="article-body" i]',
    '[class*="article_body" i]',
    '[class*="post-content" i]',
    '[class*="post_content" i]',
    '[class*="entry-content" i]',
    '[class*="entry_content" i]',
    '[class*="content-body" i]',
    '[class*="content_body" i]',
    '[class*="rich-text" i]',
    '[class*="rich_text" i]',
    '[class~="prose" i]',
    "main",
    '[role="main"]',
  ];
  for (const selector of semanticRootSelectors) {
    for (const root of document.querySelectorAll<HTMLElement>(selector)) {
      addCandidate(root);
    }
  }

  const paragraphClusters = new Map<HTMLElement, number>();
  const substantialParagraphs = Array.from(document.querySelectorAll<HTMLElement>("p, blockquote"))
    .filter((element) => isVisible(element) && elementText(element).length >= 70 && wordCount(elementText(element)) >= 10)
    .slice(0, 800);
  for (const paragraph of substantialParagraphs) {
    let ancestor = paragraph.parentElement;
    let depth = 0;
    while (ancestor && ancestor !== document.body && depth < 5) {
      if (ancestor.matches("div, section, article, main, [role='main']") && !ancestor.closest(ignoredSelector)) {
        paragraphClusters.set(ancestor, (paragraphClusters.get(ancestor) ?? 0) + 1);
      }
      ancestor = ancestor.parentElement;
      depth += 1;
    }
  }
  [...paragraphClusters.entries()]
    .filter(([, count]) => count >= 3)
    .sort((left, right) => right[1] - left[1])
    .slice(0, 40)
    .forEach(([root]) => addCandidate(root));

  if (candidateRoots.length === 0 && document.body) candidateRoots.push(document.body);

  const candidates = candidateRoots.map(evaluateRoot).sort((left, right) => {
    const suitabilityDifference = Number(right.suitable) - Number(left.suitable);
    return suitabilityDifference !== 0 ? suitabilityDifference : right.score - left.score;
  });
  const best = candidates[0];
  const relevantText = best?.relevantText ?? "";

  return {
    sourceUrl: window.location.href,
    title: normalize(document.title) || "Página sem título",
    relevantText,
    quality: {
      strategy: "manual-page",
      suitable: best?.suitable ?? false,
      textDensity: round(best?.textDensity ?? 0),
      anchorTextRatio: round(best?.anchorRatio ?? 0),
      substantialBlocks: best?.substantialBlocks ?? 0,
      listingSignals: best?.listingSignals ?? 0,
    },
  };
}

/**
 * Tenta ler o documento escolhido a partir da própria origem da página.
 * Funciona para links de mesma origem e para origens que permitem CORS. Caso a
 * origem bloqueie a leitura, a UI preserva a página atual e oferece um link que
 * só abre o documento em uma nova aba após uma ação explícita do usuário.
 */
async function fetchAndExtractDocument(documentUrl: string, maxCharacters: number): Promise<ExtractedPageContent> {
  const response = await fetch(documentUrl, {
    credentials: "same-origin",
    method: "GET",
    redirect: "follow",
  });
  if (!response.ok) throw new Error(`Falha ao carregar documento (${response.status}).`);

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType && !contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
    throw new Error("O link não retornou um documento HTML.");
  }

  const html = await response.text();
  const parsed = new DOMParser().parseFromString(html, "text/html");
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
  ].join(",");
  const blockSelector = "h1, h2, h3, h4, h5, h6, p, li, dt, dd, blockquote";
  const root =
    parsed.querySelector<HTMLElement>("main, article, [role='main'], [id*='privacy' i], [class*='privacy' i], [id*='terms' i], [class*='terms' i]") ??
    parsed.body;
  const normalize = (value: string): string => value.replace(/\s+/g, " ").trim();
  const chunks: string[] = [];
  const seen = new Set<string>();
  let currentLength = 0;

  for (const element of root.querySelectorAll<HTMLElement>(blockSelector)) {
    if (element.closest(ignoredSelector)) continue;
    const text = normalize(element.textContent ?? "");
    const isHeading = /^H[1-6]$/.test(element.tagName);
    if (text.length < (isHeading ? 3 : 18)) continue;
    const key = text.toLocaleLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const separatorLength = chunks.length === 0 ? 0 : 2;
    const remaining = maxCharacters - currentLength - separatorLength;
    if (remaining <= 0) break;
    const chunk = text.slice(0, remaining).trim();
    if (!chunk) break;
    chunks.push(chunk);
    currentLength += separatorLength + chunk.length;
  }

  const relevantText = chunks.join("\n\n").slice(0, maxCharacters);
  const rootTextLength = normalize(root.textContent ?? "").length;
  const anchorTextLength = Array.from(root.querySelectorAll<HTMLAnchorElement>("a[href]"))
    .reduce((total, anchor) => total + normalize(anchor.textContent ?? "").length, 0);

  return {
    sourceUrl: response.url || documentUrl,
    title: normalize(parsed.title) || "Documento sem título",
    relevantText,
    quality: {
      strategy: "document",
      suitable: relevantText.length >= 300 && chunks.length >= 2,
      textDensity: rootTextLength > 0 ? Math.min(1, relevantText.length / rootTextLength) : 0,
      anchorTextRatio: rootTextLength > 0 ? Math.min(1, anchorTextLength / rootTextLength) : 0,
      substantialBlocks: chunks.length,
      listingSignals: 0,
    },
  };
}
