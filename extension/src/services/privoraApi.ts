import type { AnalysisResult } from "../types/analysis";

export interface PrivoraAnalysisRequest {
  sourceUrl?: string;
  title?: string;
  text: string;
}

export interface PrivoraAnalysisClient {
  analyze(request: PrivoraAnalysisRequest): Promise<AnalysisResult>;
}

export type PrivoraApiErrorCode =
  | "invalid-request"
  | "invalid-response"
  | "provider-error"
  | "service-unavailable"
  | "timeout"
  | "network-error"
  | "unexpected-error";

export class PrivoraApiError extends Error {
  constructor(readonly code: PrivoraApiErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PrivoraApiError";
  }
}

const MAX_POLICY_TEXT_CHARACTERS = 40_000;
const DEFAULT_TIMEOUT_MS = 35_000;
const POLICY_ANALYSIS_PATH = "/api/policy-analyses";
const globalFetch: typeof fetch = (input, init) => globalThis.fetch(input, init);

export class HttpPrivoraAnalysisClient implements PrivoraAnalysisClient {
  private readonly baseUrl: string;
  private readonly fetchImplementation: typeof fetch;

  constructor(
    baseUrl = configuredApiBaseUrl(),
    fetchImplementation: typeof fetch = globalFetch,
    private readonly timeoutMs = DEFAULT_TIMEOUT_MS,
  ) {
    this.baseUrl = normalizedHttpBaseUrl(baseUrl);
    this.fetchImplementation = fetchImplementation;
  }

  async analyze(request: PrivoraAnalysisRequest): Promise<AnalysisResult> {
    validateRequest(request);

    const abortController = new AbortController();
    const timeout = globalThis.setTimeout(() => abortController.abort(), this.timeoutMs);
    try {
      const executeFetch = this.fetchImplementation;
      const response = await executeFetch(`${this.baseUrl}${POLICY_ANALYSIS_PATH}`, {
        method: "POST",
        credentials: "omit",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sourceUrl: request.sourceUrl,
          title: request.title,
          text: request.text,
        }),
        signal: abortController.signal,
      });

      if (!response.ok) throw errorForStatus(response.status);

      let body: unknown;
      try {
        body = await response.json();
      } catch (error) {
        throw new PrivoraApiError("invalid-response", "A Privora retornou uma resposta inválida.", { cause: error });
      }
      if (!isAnalysisResult(body)) {
        throw new PrivoraApiError("invalid-response", "A Privora retornou uma resposta inválida.");
      }
      return body;
    } catch (error) {
      if (error instanceof PrivoraApiError) throw error;
      if (isAbortError(error)) {
        throw new PrivoraApiError("timeout", "A análise excedeu o tempo limite.", { cause: error });
      }
      logUnexpectedClientError(error);
      throw new PrivoraApiError("network-error", "Não foi possível acessar a Privora.", { cause: error });
    } finally {
      globalThis.clearTimeout(timeout);
    }
  }
}

function configuredApiBaseUrl(): string {
  const configured = import.meta.env.VITE_PRIVORA_API_BASE_URL;
  if (!configured) {
    throw new PrivoraApiError("service-unavailable", "A URL do backend da Privora não foi configurada.");
  }
  return configured;
}

function normalizedHttpBaseUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("unsupported protocol");
    return url.href.replace(/\/+$/, "");
  } catch (error) {
    throw new PrivoraApiError("service-unavailable", "A URL do backend da Privora é inválida.", { cause: error });
  }
}

function validateRequest(request: PrivoraAnalysisRequest): void {
  if (!request.text.trim()) {
    throw new PrivoraApiError("invalid-request", "O texto da política está vazio.");
  }
  if (request.text.length > MAX_POLICY_TEXT_CHARACTERS) {
    throw new PrivoraApiError(
      "invalid-request",
      `O texto da política excede o limite de ${MAX_POLICY_TEXT_CHARACTERS} caracteres.`,
    );
  }
}

function errorForStatus(status: number): PrivoraApiError {
  if (status === 400) return new PrivoraApiError("invalid-request", "A Privora recusou o conteúdo enviado.");
  if (status === 502) return new PrivoraApiError("provider-error", "O provedor não retornou uma análise válida.");
  if (status === 503) return new PrivoraApiError("service-unavailable", "O serviço de análise está indisponível.");
  if (status === 504) return new PrivoraApiError("timeout", "A análise excedeu o tempo limite.");
  return new PrivoraApiError("unexpected-error", "A Privora não conseguiu concluir a análise.");
}

function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!isRecord(value) || !isString(value.summary)) return false;
  if (!isArrayOf(value.dataCategories, isEvidenceItem) || !isArrayOf(value.purposes, isEvidenceItem)) return false;
  if (!isArrayOf(value.sharing, isSharingItem) || !isRetention(value.retention)) return false;
  if (!isArrayOf(value.userControls, isActionItem) || !isArrayOf(value.rights, isRightItem)) return false;
  if (!isCrmAndProfiling(value.crmAndProfiling) || !isArrayOf(value.caveats, isString)) return false;
  return true;
}

function isEvidenceItem(value: unknown): boolean {
  return isRecord(value) && isString(value.name) && isString(value.evidence);
}

function isSharingItem(value: unknown): boolean {
  return isRecord(value) && isString(value.recipient) && isString(value.purpose) && isString(value.evidence);
}

function isRetention(value: unknown): boolean {
  return isRecord(value) && isString(value.summary) && isString(value.evidence);
}

function isActionItem(value: unknown): boolean {
  return isRecord(value) && isString(value.action) && isString(value.evidence);
}

function isRightItem(value: unknown): boolean {
  return isRecord(value) && isString(value.right) && isString(value.evidence);
}

function isCrmAndProfiling(value: unknown): boolean {
  return isRecord(value) && isBooleanOrNull(value.usesPersonalization) &&
    isBooleanOrNull(value.usesMarketing) && isBooleanOrNull(value.usesProfiling) &&
    isString(value.summary) && isString(value.evidence);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isArrayOf(value: unknown, predicate: (item: unknown) => boolean): boolean {
  return Array.isArray(value) && value.every(predicate);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function isBooleanOrNull(value: unknown): boolean {
  return value === null || typeof value === "boolean";
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function logUnexpectedClientError(error: unknown): void {
  if (import.meta.env.MODE !== "development") return;
  console.error("[Privora] Exceção técnica antes ou durante o fetch do backend:", error);
}
