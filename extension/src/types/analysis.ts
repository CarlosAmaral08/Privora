export type AnalysisState = "idle" | "analyzing" | "success" | "error" | "unsupported";

export interface PageContext {
  tabId?: number;
  title: string;
  url: string;
  supported: boolean;
  unsupportedReason?: string;
}

export interface ExtractedPageContent {
  sourceUrl: string;
  title: string;
  relevantText: string;
}

export interface AnalysisSection {
  id: "collectedData" | "purposes" | "sharing" | "retention" | "rights" | "controls";
  title: string;
  summary: string;
  items: string[];
}

export interface AnalysisResult {
  sourceUrl: string;
  sourceTitle: string;
  summary: string;
  sections: AnalysisSection[];
  generatedBy: "development-mock" | "privora-backend";
}
