export type AnalysisState =
  | "idle"
  | "discovering"
  | "analyzing"
  | "sending"
  | "success"
  | "error"
  | "network-error"
  | "timeout"
  | "service-unavailable"
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

export interface AnalysisEvidenceItem {
  name: string;
  evidence: string;
}

export interface AnalysisSharingItem {
  recipient: string;
  purpose: string;
  evidence: string;
}

export interface AnalysisRetention {
  summary: string;
  evidence: string;
}

export interface AnalysisActionItem {
  action: string;
  evidence: string;
}

export interface AnalysisRightItem {
  right: string;
  evidence: string;
}

export interface AnalysisCrmAndProfiling {
  usesPersonalization: boolean | null;
  usesMarketing: boolean | null;
  usesProfiling: boolean | null;
  summary: string;
  evidence: string;
}

export interface AnalysisResult {
  summary: string;
  dataCategories: AnalysisEvidenceItem[];
  purposes: AnalysisEvidenceItem[];
  sharing: AnalysisSharingItem[];
  retention: AnalysisRetention;
  userControls: AnalysisActionItem[];
  rights: AnalysisRightItem[];
  crmAndProfiling: AnalysisCrmAndProfiling;
  caveats: string[];
}
