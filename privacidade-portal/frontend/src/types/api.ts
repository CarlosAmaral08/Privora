// Estes tipos espelham os DTOs do backend Java (pasta dto/).
// Manter os dois em sincronia manualmente é o preço de não ter geração automática.

export type ConsentCategory = "NECESSARIOS" | "PREFERENCIAS" | "METRICAS_CAMPANHA";

export type EventType =
  | "VIEW_CONTENT"
  | "OPEN_DATA_PANEL"
  | "COMPLETE_QUIZ"
  | "OPEN_PRIVACY_SETTINGS"
  | "CHANGE_CONSENT"
  | "EXPORT_DATA"
  | "DELETE_DATA"
  | "VIEW_RIGHTS_SECTION"
  | "VIEW_COLLECTED_DATA_SECTION";

export type RfvSegment =
  | "CAMPEAO"
  | "RECEM_CHEGADO"
  | "FIEL_EM_RISCO"
  | "ENGAJADO_SUPERFICIAL"
  | "INATIVO"
  | "OUTRO_PERFIL";

export interface SessionResponse {
  userId: string;
  createdAt: string;
  lastSeenAt: string;
}

export interface ConsentDto {
  category: ConsentCategory;
  granted: boolean;
  updatedAt: string;
}

export interface RfvResponse {
  recency: number;
  frequency: number;
  value: number;
  code: string;
  segment: RfvSegment;
  calculatedAt: string;
}

export interface QuizResultResponse {
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface MeDataResponse {
  userId: string;
  createdAt: string;
  lastSeenAt: string;
  totalEvents: number;
  events: { eventType: string; createdAt: string }[];
  consents: ConsentDto[];
  quizResults: QuizResultResponse[];
  rfv: RfvResponse | null;
}

export interface DashboardResponse {
  totalUsers: number;
  quizCompletionRate: number;
  privacyActionRate: number;
  totalEvents: number;
  segmentDistribution: Record<string, number>;
}
