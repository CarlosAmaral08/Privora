import type { AnalysisResult } from "../types/analysis";

export interface AnalysisSource {
  title: string;
  url: string;
}

export function renderPolicyAnalysis(
  region: HTMLElement,
  analysis: AnalysisResult,
  source: AnalysisSource,
): void {
  region.innerHTML = policyAnalysisHtml(analysis, source);
}

export function policyAnalysisHtml(analysis: AnalysisResult, source: AnalysisSource): string {
  return `
    <div class="result-heading analysis-result-heading">
      <span class="analysis-badge"><i aria-hidden="true"></i> Análise estruturada</span>
      <h2>Análise da política</h2>
      <p>A IA organiza somente o que o documento declara e não substitui a leitura da fonte original.</p>
    </div>
    <div class="analysis-source">
      <div>
        <small>Documento analisado</small>
        <strong>${escapeHtml(source.title)}</strong>
        <span>${escapeHtml(sourceOrigin(source.url))}</span>
      </div>
      ${sourceLink(source.url)}
    </div>
    <div class="analysis-sections">
      ${summarySection(analysis.summary)}
      ${namedEvidenceSection("Dados coletados", analysis.dataCategories)}
      ${namedEvidenceSection("Para que são usados", analysis.purposes)}
      ${sharingSection(analysis)}
      ${singleEvidenceSection("Retenção", analysis.retention.summary, analysis.retention.evidence)}
      ${actionSection("Seus controles", analysis.userControls)}
      ${rightsSection(analysis)}
      ${crmSection(analysis)}
      ${caveatsSection(analysis.caveats)}
    </div>
  `;
}

function summarySection(summary: string): string {
  return `<section class="analysis-section analysis-summary"><h3>Resumo</h3><p>${escapeHtml(summary)}</p></section>`;
}

function namedEvidenceSection(
  title: string,
  items: Array<{ name: string; evidence: string }>,
): string {
  return analysisListSection(
    title,
    items.map((item) => `<li><strong>${escapeHtml(item.name)}</strong>${evidenceDetails(item.evidence)}</li>`),
  );
}

function sharingSection(analysis: AnalysisResult): string {
  return analysisListSection(
    "Compartilhamento",
    analysis.sharing.map((item) => `
      <li>
        <strong>${escapeHtml(item.recipient)}</strong>
        <span>${escapeHtml(item.purpose)}</span>
        ${evidenceDetails(item.evidence)}
      </li>
    `),
  );
}

function singleEvidenceSection(title: string, summary: string, evidence: string): string {
  return `
    <section class="analysis-section">
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(summary)}</p>
      ${evidenceDetails(evidence)}
    </section>
  `;
}

function actionSection(title: string, items: AnalysisResult["userControls"]): string {
  return analysisListSection(
    title,
    items.map((item) => `<li><strong>${escapeHtml(item.action)}</strong>${evidenceDetails(item.evidence)}</li>`),
  );
}

function rightsSection(analysis: AnalysisResult): string {
  return analysisListSection(
    "Direitos mencionados",
    analysis.rights.map((item) => `<li><strong>${escapeHtml(item.right)}</strong>${evidenceDetails(item.evidence)}</li>`),
  );
}

function crmSection(analysis: AnalysisResult): string {
  const crm = analysis.crmAndProfiling;
  return `
    <section class="analysis-section crm-section">
      <h3>Personalização, marketing e perfilamento</h3>
      <div class="analysis-flags">
        ${analysisFlag("Personalização", crm.usesPersonalization)}
        ${analysisFlag("Marketing", crm.usesMarketing)}
        ${analysisFlag("Perfilamento", crm.usesProfiling)}
      </div>
      <p>${escapeHtml(crm.summary)}</p>
      ${evidenceDetails(crm.evidence)}
    </section>
  `;
}

function caveatsSection(caveats: string[]): string {
  return analysisListSection(
    "Ressalvas",
    caveats.map((caveat) => `<li><span>${escapeHtml(caveat)}</span></li>`),
  );
}

function analysisListSection(title: string, items: string[]): string {
  return `
    <section class="analysis-section">
      <h3>${escapeHtml(title)}</h3>
      ${items.length > 0
        ? `<ul class="analysis-list">${items.join("")}</ul>`
        : '<p class="not-informed">Não informado no documento.</p>'}
    </section>
  `;
}

function analysisFlag(label: string, value: boolean | null): string {
  const state = value === null ? "unknown" : String(value);
  const text = value === null ? "Não informado" : value ? "Sim" : "Não";
  return `
    <div class="analysis-flag" data-value="${state}">
      <span>${escapeHtml(label)}</span>
      <strong>${text}</strong>
    </div>
  `;
}

function evidenceDetails(evidence: string): string {
  return `
    <details class="analysis-evidence">
      <summary>Ver evidência</summary>
      <p>${escapeHtml(evidence)}</p>
    </details>
  `;
}

function sourceLink(value: string): string {
  const safeUrl = safeHttpUrl(value);
  if (!safeUrl) return "";
  return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noreferrer">Abrir original <span aria-hidden="true">↗</span></a>`;
}

function sourceOrigin(value: string): string {
  return safeHttpUrl(value) ? new URL(value).hostname : "Origem não informada";
}

function safeHttpUrl(value: string): string | null {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" };
    return entities[character];
  });
}
