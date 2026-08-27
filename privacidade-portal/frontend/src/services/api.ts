// Funções específicas de cada recurso da API. As páginas chamam essas
// funções em vez de usar httpClient diretamente - fica mais fácil de ler.

import { httpClient } from "./httpClient";
import type {
  ConsentCategory,
  ConsentDto,
  DashboardResponse,
  EventType,
  MeDataResponse,
  QuizResultResponse,
  RfvResponse,
  SessionResponse,
} from "../types/api";

export const sessionApi = {
  abrir: () => httpClient.post<SessionResponse>("/session"),
};

export const meApi = {
  buscarDados: () => httpClient.get<MeDataResponse>("/me/data"),
  buscarRfv: () => httpClient.get<RfvResponse>("/me/rfv"),
  exportar: () => httpClient.get<MeDataResponse>("/export"),
  apagar: () => httpClient.delete<void>("/me"),
};

export const consentApi = {
  listar: () => httpClient.get<ConsentDto[]>("/consents"),
  atualizar: (consents: { category: ConsentCategory; granted: boolean }[]) =>
    httpClient.put<ConsentDto[]>("/consents", { consents }),
};

export const eventApi = {
  registrar: (eventType: EventType, metadataJson?: string) =>
    httpClient.post<RfvResponse>("/events", { eventType, metadataJson }),
};

export const quizApi = {
  enviar: (score: number, totalQuestions: number) =>
    httpClient.post<QuizResultResponse>("/quiz", { score, totalQuestions }),
};

export const dashboardApi = {
  buscar: () => httpClient.get<DashboardResponse>("/dashboard"),
};
