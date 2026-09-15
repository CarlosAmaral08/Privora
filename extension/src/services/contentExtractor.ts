import type { ExtractedPageContent, PageContext } from "../types/analysis";

/** Contrato para a futura extração explícita de conteúdo da aba ativa. */
export interface PageContentExtractor {
  extract(page: PageContext): Promise<ExtractedPageContent>;
}

/**
 * Placeholder intencional. A extensão ainda não lê o DOM nem injeta scripts.
 * A implementação futura deverá rodar somente após uma ação explícita do usuário.
 */
export class NotImplementedPageContentExtractor implements PageContentExtractor {
  async extract(_page: PageContext): Promise<ExtractedPageContent> {
    throw new Error("A extração de conteúdo ainda não foi implementada.");
  }
}
