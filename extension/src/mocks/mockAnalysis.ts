import { isLikelyPolicyPage } from "../services/currentTab";
import type { AnalysisResult, PageContext } from "../types/analysis";

const MOCK_DELAY_MS = 1100;

/**
 * MOCK TEMPORÁRIO PARA DESENVOLVIMENTO VISUAL.
 * Estes dados não vêm de IA, da página atual ou do backend da Privora.
 * Remover quando o pipeline real de extração + análise estiver disponível.
 */
const TEMPORARY_MOCK_SECTIONS: AnalysisResult["sections"] = [
  {
    id: "collectedData",
    title: "Dados coletados",
    summary: "A política declara coleta de dados cadastrais, técnicos e de uso.",
    items: ["Dados informados em formulários", "Endereço IP e dispositivo", "Interações com o serviço"],
  },
  {
    id: "purposes",
    title: "Finalidades",
    summary: "Os dados são usados para operar, proteger e melhorar o serviço.",
    items: ["Prestação do serviço", "Segurança e prevenção a fraudes", "Personalização da experiência"],
  },
  {
    id: "sharing",
    title: "Compartilhamento",
    summary: "Pode ocorrer com fornecedores essenciais e mediante obrigação legal.",
    items: ["Infraestrutura e hospedagem", "Processadores contratados", "Autoridades, quando exigido"],
  },
  {
    id: "retention",
    title: "Retenção",
    summary: "Os prazos variam conforme finalidade e obrigações aplicáveis.",
    items: ["Durante a relação com o serviço", "Conforme prazo legal", "Até solicitação válida de exclusão"],
  },
  {
    id: "rights",
    title: "Direitos",
    summary: "O titular pode solicitar acesso, correção, portabilidade e exclusão.",
    items: ["Confirmar e acessar o tratamento", "Corrigir dados", "Revogar consentimento"],
  },
  {
    id: "controls",
    title: "Controles disponíveis",
    summary: "A política indica canais e configurações para exercer escolhas.",
    items: ["Preferências de cookies", "Canal de privacidade", "Download ou exclusão de dados"],
  },
];

export async function runTemporaryMockAnalysis(page: PageContext): Promise<AnalysisResult | null> {
  await new Promise((resolve) => window.setTimeout(resolve, MOCK_DELAY_MS));

  if (!isLikelyPolicyPage(page)) {
    return null;
  }

  return {
    sourceUrl: page.url,
    sourceTitle: page.title,
    summary: "Esta é uma prévia visual de como a Privora poderá organizar uma política extensa em tópicos verificáveis.",
    sections: TEMPORARY_MOCK_SECTIONS,
    generatedBy: "development-mock",
  };
}
