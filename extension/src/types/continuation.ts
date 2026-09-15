import type { DiscoveredDocument } from "./analysis";

export interface PendingDocumentAnalysis {
  document: DiscoveredDocument;
  createdAt: number;
  createdByExtension: boolean;
  status: "loading" | "ready";
  requestedOriginPattern: string;
  observedUrl?: string;
  crossOriginRedirectObserved?: boolean;
  finalUrl?: string;
  effectiveUrl?: string;
}

export interface OpenDocumentForAnalysisMessage {
  type: "open-document-for-analysis";
  document: DiscoveredDocument;
}

export interface OpenDocumentForAnalysisResponse {
  ok: boolean;
  error?: string;
}
