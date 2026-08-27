import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api";
import type { DashboardResponse } from "../types/api";

const SEGMENTO_LABEL: Record<string, string> = {
  CAMPEAO: "Campeão",
  RECEM_CHEGADO: "Recém-chegado",
  FIEL_EM_RISCO: "Fiel em risco",
  ENGAJADO_SUPERFICIAL: "Engajado superficial",
  INATIVO: "Inativo",
  OUTRO_PERFIL: "Outro perfil",
};

export function Dashboard() {
  const [dados, setDados] = useState<DashboardResponse | null>(null);

  useEffect(() => {
    dashboardApi.buscar().then(setDados);
  }, []);

  if (!dados) {
    return (
      <section className="page">
        <h1>Dashboard</h1>
        <p>Carregando...</p>
      </section>
    );
  }

  const maiorSegmento = Math.max(1, ...Object.values(dados.segmentDistribution));

  return (
    <section className="page page-dashboard">
      <h1>Dashboard (apresentação acadêmica)</h1>
      <p className="lead">
        Números agregados de todos os visitantes anônimos. Nenhum dado individual identificável é
        exibido aqui.
      </p>

      <div className="card-grid">
        <div className="card metric">
          <span className="metric-value">{dados.totalUsers}</span>
          <span className="metric-label">Usuários (sessões anônimas)</span>
        </div>
        <div className="card metric">
          <span className="metric-value">{(dados.quizCompletionRate * 100).toFixed(0)}%</span>
          <span className="metric-label">Taxa de conclusão do quiz</span>
        </div>
        <div className="card metric">
          <span className="metric-value">{(dados.privacyActionRate * 100).toFixed(0)}%</span>
          <span className="metric-label">Taxa de ações de privacidade</span>
        </div>
        <div className="card metric">
          <span className="metric-value">{dados.totalEvents}</span>
          <span className="metric-label">Eventos registrados</span>
        </div>
      </div>

      <h2>Distribuição de segmentos RFV</h2>
      <div className="bar-chart">
        {Object.entries(dados.segmentDistribution).map(([segmento, quantidade]) => (
          <div className="bar-row" key={segmento}>
            <span className="bar-label">{SEGMENTO_LABEL[segmento] ?? segmento}</span>
            <div className="bar-track">
              <div className="bar-fill" style={{ width: `${(quantidade / maiorSegmento) * 100}%` }} />
            </div>
            <span className="bar-value">{quantidade}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
