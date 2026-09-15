import type { PageContext } from "../types/analysis";
import { identifyCurrentDocument } from "./privacyDocumentDiscovery";

const SUPPORTED_PROTOCOLS = new Set(["http:", "https:"]);

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
  return identifyCurrentDocument(page) !== null;
}

function isSupportedUrl(value: string): boolean {
  try {
    return SUPPORTED_PROTOCOLS.has(new URL(value).protocol);
  } catch {
    return false;
  }
}
