import { afterEach, describe, expect, it, vi } from "vitest";
import type { AnalysisResult } from "../types/analysis";
import { HttpPrivoraAnalysisClient, PrivoraApiError } from "./privoraApi";

const analysis: AnalysisResult = {
  summary: "A política descreve coleta para prestar o serviço.",
  dataCategories: [{ name: "Cadastro", evidence: "Nome e e-mail são coletados." }],
  purposes: [{ name: "Operação", evidence: "Dados usados para operar a conta." }],
  sharing: [],
  retention: { summary: "Não informado no documento", evidence: "Não informado no documento" },
  userControls: [],
  rights: [],
  crmAndProfiling: {
    usesPersonalization: true,
    usesMarketing: false,
    usesProfiling: null,
    summary: "Personalização declarada; perfilamento não informado.",
    evidence: "O documento menciona conteúdo personalizado.",
  },
  caveats: ["Prazo de retenção não informado."],
};

describe("HttpPrivoraAnalysisClient", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("chama o fetch global com o receiver nativo correto", async () => {
    const receiverSensitiveFetch = vi.fn(function (
      this: typeof globalThis,
      _input: RequestInfo | URL,
      _init?: RequestInit,
    ): Promise<Response> {
      if (this !== globalThis) throw new TypeError("Illegal invocation: receiver incorreto");
      return Promise.resolve(jsonResponse(analysis));
    });
    vi.stubGlobal("fetch", receiverSensitiveFetch);
    const client = new HttpPrivoraAnalysisClient("http://localhost:8080");

    const result = await client.analyze({ text: "Texto da política." });

    expect(result.summary).toContain("coleta");
    expect(receiverSensitiveFetch).toHaveBeenCalledOnce();
  });

  it("envia somente o request esperado, sem cookies", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(analysis));
    const client = new HttpPrivoraAnalysisClient("http://localhost:8080/", fetchMock);

    await client.analyze({
      sourceUrl: "https://example.com/privacy",
      title: "Política de Privacidade",
      text: "Texto extraído da política.",
    });

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("http://localhost:8080/api/policy-analyses");
    expect(options).toMatchObject({
      method: "POST",
      credentials: "omit",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
    });
    expect(JSON.parse(String(options?.body))).toEqual({
      sourceUrl: "https://example.com/privacy",
      title: "Política de Privacidade",
      text: "Texto extraído da política.",
    });
  });

  it("aceita uma resposta estruturada válida e preserva null nas flags", async () => {
    const client = new HttpPrivoraAnalysisClient(
      "https://privora.zapeu.net",
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse(analysis)),
    );

    const result = await client.analyze({ text: "Texto da política." });

    expect(result.summary).toContain("coleta");
    expect(result.crmAndProfiling.usesPersonalization).toBe(true);
    expect(result.crmAndProfiling.usesMarketing).toBe(false);
    expect(result.crmAndProfiling.usesProfiling).toBeNull();
  });

  it.each([
    [400, "invalid-request"],
    [502, "provider-error"],
    [503, "service-unavailable"],
    [504, "timeout"],
  ] as const)("converte HTTP %s em %s sem expor o corpo", async (status, expectedCode) => {
    const response = new Response("detalhe interno que não deve aparecer", { status });
    const client = new HttpPrivoraAnalysisClient(
      "https://privora.zapeu.net",
      vi.fn<typeof fetch>().mockResolvedValue(response),
    );

    await expect(client.analyze({ text: "Texto da política." })).rejects.toMatchObject({
      name: "PrivoraApiError",
      code: expectedCode,
    });
    await expect(client.analyze({ text: "Texto da política." })).rejects.not.toThrow("detalhe interno");
  });

  it("converte falha de rede em erro seguro", async () => {
    const client = new HttpPrivoraAnalysisClient(
      "https://privora.zapeu.net",
      vi.fn<typeof fetch>().mockRejectedValue(new TypeError("Failed to fetch")),
    );

    await expect(client.analyze({ text: "Texto da política." })).rejects.toMatchObject({
      name: "PrivoraApiError",
      code: "network-error",
    });
  });

  it("cancela a requisição quando o timeout local expira", async () => {
    const pendingFetch = vi.fn<typeof fetch>((_input, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
    }));
    const client = new HttpPrivoraAnalysisClient("https://privora.zapeu.net", pendingFetch, 1);

    await expect(client.analyze({ text: "Texto da política." })).rejects.toMatchObject({
      name: "PrivoraApiError",
      code: "timeout",
    });
  });

  it("rejeita resposta que não respeita o contrato estruturado", async () => {
    const client = new HttpPrivoraAnalysisClient(
      "https://privora.zapeu.net",
      vi.fn<typeof fetch>().mockResolvedValue(jsonResponse({ summary: "incompleto" })),
    );

    await expect(client.analyze({ text: "Texto da política." })).rejects.toBeInstanceOf(PrivoraApiError);
    await expect(client.analyze({ text: "Texto da política." })).rejects.toMatchObject({ code: "invalid-response" });
  });

  it("não trunca silenciosamente texto acima de 40 mil caracteres", async () => {
    const fetchMock = vi.fn<typeof fetch>();
    const client = new HttpPrivoraAnalysisClient("https://privora.zapeu.net", fetchMock);

    await expect(client.analyze({ text: "a".repeat(40_001) })).rejects.toMatchObject({
      code: "invalid-request",
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
