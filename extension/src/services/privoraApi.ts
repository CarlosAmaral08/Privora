import type { AnalysisResult, ExtractedPageContent } from "../types/analysis";

export interface PrivoraAnalysisRequest {
  page: ExtractedPageContent;
  language: "pt-BR";
}

/** Contrato isolado para a futura integração POST com o backend da Privora. */
export interface PrivoraAnalysisClient {
  analyze(request: PrivoraAnalysisRequest): Promise<AnalysisResult>;
}

/** Este cliente não envia conteúdo ao backend da Privora neste MVP. */
export class NotImplementedPrivoraAnalysisClient implements PrivoraAnalysisClient {
  async analyze(_request: PrivoraAnalysisRequest): Promise<AnalysisResult> {
    throw new Error("A integração com o backend da Privora ainda não foi implementada.");
  }
}
