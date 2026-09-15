import type { PageContext } from "../types/analysis";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);
const POLICY_HINTS = [
  "privacy",
  "privacidade",
  "policy",
  "politica",
  "política",
  "terms",
  "termos",
  "legal",
  "lgpd",
  "cookies",
];

export async function getCurrentPage(): Promise<PageContext> {
  if (typeof chrome === "undefined" || !chrome.tabs?.query) {
    return {
      title: "Política de Privacidade — Página de exemplo",
      url: "https://exemplo.com/politica-de-privacidade",
      supported: true,
    };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {
    throw new Error("Não foi possível identificar a aba atual.");
  }

  const supported = isSupportedUrl(tab.url);

  return {
    tabId: tab.id,
    title: tab.title?.trim() || "Página sem título",
    url: tab.url,
    supported,
    unsupportedReason: supported
      ? undefined
      : "Esta página é protegida pelo navegador e não pode ser analisada.",
  };
}

export function isLikelyPolicyPage(page: PageContext): boolean {
  const searchableText = `${page.title} ${page.url}`.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  return POLICY_HINTS.some((hint) => searchableText.includes(hint.normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
}

function isSupportedUrl(value: string): boolean {
  try {
    return SUPPORTED_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
