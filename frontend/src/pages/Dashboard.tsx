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
      <section className="page page-loading" aria-live="polite">
        <span className="loading-mark" aria-hidden="true" />
        <h1>Preparando visão agregada</h1>
        <p>Calculando indicadores anônimos...</p>
      </section>
    );
  }

  const maiorSegmento = Math.max(1, ...Object.values(dados.segmentDistribution));

  return (
    <section className="page page-dashboard">
      <header className="page-header page-header-split">
        <div>
          <span className="page-kicker">Visão acadêmica</span>
          <h1>Indicadores agregados</h1>
        </div>
        <p className="lead">
          Números agregados de visitantes anônimos. Nenhum dado individual identificável é exibido aqui.
        </p>
      </header>

      <div className="card-grid metrics-grid">
        <article className="card metric">
          <span className="metric-icon" aria-hidden="true">◌</span>
          <span className="metric-value">{dados.totalUsers}</span>
          <span className="metric-label">Usuários (sessões anônimas)</span>
        </article>
        <article className="card metric">
          <span className="metric-icon" aria-hidden="true">✓</span>
          <span className="metric-value">{(dados.quizCompletionRate * 100).toFixed(0)}%</span>
          <span className="metric-label">Taxa de conclusão do quiz</span>
        </article>
        <article className="card metric">
          <span className="metric-icon" aria-hidden="true">↗</span>
          <span className="metric-value">{(dados.privacyActionRate * 100).toFixed(0)}%</span>
          <span className="metric-label">Taxa de ações de privacidade</span>
        </article>
        <article className="card metric">
          <span className="metric-icon" aria-hidden="true">◇</span>
          <span className="metric-value">{dados.totalEvents}</span>
          <span className="metric-label">Eventos registrados</span>
        </article>
      </div>

      <section className="content-panel chart-panel">
      <div className="section-title-row">
        <div><span className="page-kicker">Leitura posicional</span><h2>Distribuição de segmentos RFV</h2></div>
        <span className="section-count">Dados agregados</span>
      </div>
      <div className="bar-chart">
        {Object.entries(dados.segmentDistribution).map(([segmento, quantidade]) => (
          <div className="bar-row" key={segmento}>
            <span className="bar-label">{SEGMENTO_LABEL[segmento] ?? segmento}</span>
            <div className="bar-track" aria-label={`${quantidade} no segmento ${SEGMENTO_LABEL[segmento] ?? segmento}`}>
              <div className="bar-fill" style={{ width: `${(quantidade / maiorSegmento) * 100}%` }} />
            </div>
            <span className="bar-value">{quantidade}</span>
          </div>
        ))}
      </div>
      </section>
    </section>
  );
}
