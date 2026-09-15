export type AnalysisState =
  | "idle"
  | "discovering"
  | "analyzing"
  | "success"
  | "error"
  | "unsupported"
  | "manual-required";

export type PrivacyDocumentType = "privacy" | "terms" | "cookies" | "legal";

export interface DiscoveredDocument {
  type: PrivacyDocumentType;
  title: string;
  url: string;
  confidence: number;
}

export interface DiscoverableLink {
  text: string;
  ariaLabel: string;
  title: string;
  href: string;
  inFooter: boolean;
}

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
  quality: ExtractionQuality;
}

export interface ExtractionQuality {
  strategy: "document" | "manual-page";
  suitable: boolean;
  textDensity: number;
  anchorTextRatio: number;
  substantialBlocks: number;
  listingSignals: number;
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
