import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "../types/analysis";
import { policyAnalysisHtml } from "./analysisResult";

describe("policyAnalysisHtml", () => {
  it("renderiza coleções vazias e diferencia true, false e null", () => {
    const analysis: AnalysisResult = {
      summary: "Resumo seguro <script>alert(1)</script>",
      dataCategories: [],
      purposes: [],
      sharing: [],
      retention: { summary: "Não informado", evidence: "Ausência de prazo explícito." },
      userControls: [],
      rights: [],
      crmAndProfiling: {
        usesPersonalization: true,
        usesMarketing: false,
        usesProfiling: null,
        summary: "Somente personalização foi declarada.",
        evidence: "Trecho curto.",
      },
      caveats: [],
    };

    const html = policyAnalysisHtml(analysis, {
      title: "Política & Privacidade",
      url: "https://example.com/privacy",
    });

    expect(html).toContain("Política &amp; Privacidade");
    expect(html).toContain("Resumo seguro &lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain('data-value="true"');
    expect(html).toContain('data-value="false"');
    expect(html).toContain('data-value="unknown"');
    expect(html).toContain("Não informado");
    expect(html).toContain("Abrir original");
    expect(html).not.toContain("undefined");
  });
});
