import type {
  DiscoverableLink,
  DiscoveredDocument,
  PageContext,
  PrivacyDocumentType,
} from "../types/analysis";

const DOCUMENT_PRIORITY: Record<PrivacyDocumentType, number> = {
  privacy: 4,
  terms: 3,
  cookies: 2,
  legal: 1,
};

const TYPE_SIGNALS: Record<PrivacyDocumentType, RegExp[]> = {
  privacy: [
    /\bprivacy policy\b/,
    /\bpolitica de privacidade\b/,
    /\bpolitica privacidade\b/,
    /\bprivacy\b/,
    /\bprivacidade\b/,
    /\blgpd\b/,
  ],
  terms: [/\bterms of service\b/, /\bterms and conditions\b/, /\btermos de servico\b/, /\bterms\b/, /\btermos\b/],
  cookies: [/\bcookie policy\b/, /\bpolitica de cookies\b/, /\bcookies?\b/],
  legal: [/\blegal notice\b/, /\baviso legal\b/, /\blegal\b/],
};

const STRONG_PAGE_SIGNALS: Record<PrivacyDocumentType, RegExp[]> = {
  privacy: [/\bprivacy policy\b/, /\bpolitica de privacidade\b/, /\bprivacy notice\b/, /\baviso de privacidade\b/],
  terms: [/\bterms of service\b/, /\bterms and conditions\b/, /\btermos de (uso|servico)\b/],
  cookies: [/\bcookie policy\b/, /\bpolitica de cookies\b/],
  legal: [/\blegal notice\b/, /\baviso legal\b/],
};

const EXACT_LINK_LABELS: Record<PrivacyDocumentType, RegExp[]> = {
  privacy: [/^(privacy policy|politica de privacidade|privacy notice|aviso de privacidade|privacy|privacidade|lgpd)$/],
  terms: [/^(terms of service|terms and conditions|termos de uso|termos de servico|terms|termos)$/],
  cookies: [/^(cookie policy|politica de cookies|cookies?)$/],
  legal: [/^(legal notice|aviso legal|legal)$/],
};

const GENERIC_ACTION_PATH = /(^| \/ )(login|log in|signin|sign in|signup|sign up|account|accounts|auth|oauth|session|consent|preferences|settings|search|support|help)( \/ |$)/;
const MIN_CANDIDATE_CONFIDENCE = 0.58;

export interface PrivacyDocumentDiscovery {
  discover(page: PageContext): Promise<DiscoveredDocument[]>;
}

/**
 * Lê somente os links da aba quando a extensão é aberta ou acionada.
 * Nenhum resultado é persistido e nenhuma navegação ocorre durante a descoberta.
 */
export class BrowserPrivacyDocumentDiscovery implements PrivacyDocumentDiscovery {
  async discover(page: PageContext): Promise<DiscoveredDocument[]> {
    if (!page.tabId) return [];

    const [injection] = await chrome.scripting.executeScript<[], DiscoverableLink[]>({
      target: { tabId: page.tabId },
      func: collectDiscoverableLinks,
      args: [],
    });

    return rankPrivacyDocuments(injection?.result ?? [], page.url);
  }
}

/** Pure ranking step kept separate from DOM access so the heuristics are testable. */
export function rankPrivacyDocuments(links: DiscoverableLink[], pageUrl: string): DiscoveredDocument[] {
  const candidates = new Map<string, DiscoveredDocument>();

  for (const link of links) {
    const url = normalizeDocumentUrl(link.href, pageUrl);
    if (!url) continue;

    const visibleSignals = normalizeSignalText(`${link.text} ${link.ariaLabel} ${link.title}`);
    const pathSignals = normalizedPath(url);
    const type = classifySignals(link, visibleSignals, pathSignals);
    if (!type) continue;
    if (isGenericActionUrl(url, type)) continue;

    const title = bestDocumentTitle(link, type);
    const confidence = scoreCandidate(
      type,
      visibleSignals,
      pathSignals,
      hasExactLabel(link, type),
      title,
      url,
      pageUrl,
      link.inFooter,
    );
    if (confidence < MIN_CANDIDATE_CONFIDENCE) continue;
    const key = canonicalUrlKey(url);
    const previous = candidates.get(key);

    if (!previous || confidence > previous.confidence) {
      candidates.set(key, { type, title, url, confidence });
    }
  }

  return [...candidates.values()].sort((left, right) => {
    const confidenceDifference = right.confidence - left.confidence;
    if (confidenceDifference !== 0) return confidenceDifference;
    const priorityDifference = DOCUMENT_PRIORITY[right.type] - DOCUMENT_PRIORITY[left.type];
    if (priorityDifference !== 0) return priorityDifference;
    return left.title.localeCompare(right.title, "pt-BR");
  });
}

/**
 * A página atual só é classificada por título/URL, nunca pelo volume de texto.
 * Frases fortes bastam; palavras isoladas precisam aparecer em um segmento da URL.
 */
export function identifyCurrentDocument(page: PageContext): DiscoveredDocument | null {
  const title = normalizeSignalText(page.title);
  const pathSignals = normalizedPath(page.url);

  for (const type of orderedTypes()) {
    const hasStrongTitle = STRONG_PAGE_SIGNALS[type].some((signal) => signal.test(title));
    const hasStrongUrl = STRONG_PAGE_SIGNALS[type].some((signal) => signal.test(pathSignals));
    const hasTypedPath = isDocumentPath(type, pathSignals);
    if (!hasStrongTitle && !hasStrongUrl && !hasTypedPath) continue;

    return {
      type,
      title: page.title || defaultTitle(type),
      url: page.url,
      confidence: clampConfidence(0.72 + (hasStrongTitle ? 0.16 : 0) + (hasTypedPath ? 0.08 : 0)),
    };
  }

  return null;
}

function collectDiscoverableLinks(): DiscoverableLink[] {
  return Array.from(document.querySelectorAll<HTMLAnchorElement>("a[href]"), (anchor) => ({
    text: (anchor.innerText || anchor.textContent || "").replace(/\s+/g, " ").trim(),
    ariaLabel: anchor.getAttribute("aria-label")?.trim() ?? "",
    title: anchor.getAttribute("title")?.trim() ?? "",
    href: anchor.getAttribute("href") ?? "",
    inFooter: Boolean(anchor.closest("footer, [role='contentinfo']")),
  }));
}

function classifySignals(
  link: DiscoverableLink,
  visibleSignals: string,
  pathSignals: string,
): PrivacyDocumentType | null {
  for (const type of orderedTypes()) {
    const hrefMatch = TYPE_SIGNALS[type].some((signal) => signal.test(pathSignals));
    const strongVisibleMatch = STRONG_PAGE_SIGNALS[type].some((signal) => signal.test(visibleSignals));
    const exactVisibleMatch = hasExactLabel(link, type);
    if (hrefMatch || strongVisibleMatch || exactVisibleMatch) return type;
  }
  return null;
}

function scoreCandidate(
  type: PrivacyDocumentType,
  visibleSignals: string,
  pathSignals: string,
  exactVisibleMatch: boolean,
  title: string,
  candidateUrl: string,
  pageUrl: string,
  inFooter: boolean,
): number {
  const visibleMatch = TYPE_SIGNALS[type].some((signal) => signal.test(visibleSignals));
  const pathMatch = TYPE_SIGNALS[type].some((signal) => signal.test(pathSignals));
  const strongVisibleMatch = STRONG_PAGE_SIGNALS[type].some((signal) => signal.test(visibleSignals));
  const documentPath = isDocumentPath(type, pathSignals);
  const relationship = domainRelationship(candidateUrl, pageUrl);
  const genericUrl = isGenericUrl(candidateUrl, documentPath);

  let score = 0.08;
  if (exactVisibleMatch) score += 0.36;
  if (strongVisibleMatch) score += 0.25;
  if (visibleMatch) score += 0.1;
  if (pathMatch && documentPath) score += 0.32;
  if (inFooter) score += 0.03;
  if (relationship === "same-page") score += 0.5;
  if (relationship === "same-host") score += 0.17;
  if (relationship === "same-organization") score += 0.11;
  if (relationship === "external") score -= 0.12;
  if (genericUrl) score -= 0.22;
  if (title.length > 140) score -= 0.1;
  return clampConfidence(score);
}

function hasExactLabel(link: DiscoverableLink, type: PrivacyDocumentType): boolean {
  return [link.text, link.ariaLabel, link.title]
    .map(normalizeSignalText)
    .filter(Boolean)
    .some((label) => EXACT_LINK_LABELS[type].some((signal) => signal.test(label)));
}

function domainRelationship(candidateUrl: string, pageUrl: string): "same-page" | "same-host" | "same-organization" | "external" {
  try {
    const candidate = new URL(candidateUrl);
    const page = new URL(pageUrl);
    if (canonicalUrlKey(candidate.href) === canonicalUrlKey(page.href)) return "same-page";
    if (candidate.hostname === page.hostname) return "same-host";
    if (organizationalDomain(candidate.hostname) === organizationalDomain(page.hostname)) return "same-organization";
  } catch {
    // URLs inválidas são eliminadas antes desta etapa.
  }
  return "external";
}

function isGenericActionUrl(candidateUrl: string, type: PrivacyDocumentType): boolean {
  const path = normalizedPath(candidateUrl);
  return GENERIC_ACTION_PATH.test(path) && !isDocumentPath(type, path);
}

function isGenericUrl(candidateUrl: string, documentPath: boolean): boolean {
  if (documentPath) return false;
  try {
    const url = new URL(candidateUrl);
    const segments = url.pathname.split("/").filter(Boolean);
    return segments.length === 0 || segments.every((segment) => /^(home|index|intl|pt|br|en|us|global)$/i.test(segment));
  } catch {
    return true;
  }
}

function organizationalDomain(hostname: string): string {
  const parts = hostname.toLowerCase().split(".").filter(Boolean);
  const suffixLength = parts.at(-1)?.length === 2 && parts.at(-2)?.length === 2 ? 3 : 2;
  return parts.slice(-suffixLength).join(".");
}

function normalizeDocumentUrl(value: string, pageUrl: string): string | null {
  try {
    const url = new URL(value, pageUrl);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    for (const parameter of [...url.searchParams.keys()]) {
      if (/^(utm_|ref$|source$)/i.test(parameter)) url.searchParams.delete(parameter);
    }
    return url.href;
  } catch {
    return null;
  }
}

function canonicalUrlKey(value: string): string {
  const url = new URL(value);
  const pathname = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;
  return `${url.protocol}//${url.hostname.toLowerCase()}${url.port ? `:${url.port}` : ""}${pathname}${url.search}`;
}

function normalizedPath(value: string): string {
  try {
    return new URL(value).pathname
      .split("/")
      .map((segment) => normalizeSignalText(safeDecodeUrl(segment)))
      .filter(Boolean)
      .join(" / ");
  } catch {
    return "";
  }
}

function isDocumentPath(type: PrivacyDocumentType, normalizedPathname: string): boolean {
  const segments = normalizedPathname.split(" / ").filter(Boolean);
  const exactSegmentMatch = segments.some((segment) => EXACT_LINK_LABELS[type].some((signal) => signal.test(segment)));
  const strongPathMatch = STRONG_PAGE_SIGNALS[type].some((signal) => signal.test(normalizedPathname.replaceAll(" / ", " ")));
  return exactSegmentMatch || strongPathMatch;
}

function bestDocumentTitle(link: DiscoverableLink, type: PrivacyDocumentType): string {
  const labels = [link.text, link.ariaLabel, link.title].map((value) => value.trim()).filter(Boolean);
  const semanticLabel = labels.find((value) => {
    const normalized = normalizeSignalText(value);
    return STRONG_PAGE_SIGNALS[type].some((signal) => signal.test(normalized)) ||
      EXACT_LINK_LABELS[type].some((signal) => signal.test(normalized));
  });
  return semanticLabel || defaultTitle(type);
}

function defaultTitle(type: PrivacyDocumentType): string {
  const titles: Record<PrivacyDocumentType, string> = {
    privacy: "Política de Privacidade",
    terms: "Termos de Serviço",
    cookies: "Política de Cookies",
    legal: "Informações legais",
  };
  return titles[type];
}

function orderedTypes(): PrivacyDocumentType[] {
  return ["privacy", "terms", "cookies", "legal"];
}

function normalizeSignalText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function safeDecodeUrl(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function clampConfidence(value: number): number {
  return Math.round(Math.min(0.99, Math.max(0, value)) * 100) / 100;
}
