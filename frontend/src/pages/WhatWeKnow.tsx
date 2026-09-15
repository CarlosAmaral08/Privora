import { useEffect, useState } from "react";
import { meApi } from "../services/api";
import { useSession } from "../context/SessionContext";
import type { MeDataResponse } from "../types/api";

const SEGMENTO_LABEL: Record<string, string> = {
  CAMPEAO: "Campeão",
  RECEM_CHEGADO: "Recém-chegado",
  FIEL_EM_RISCO: "Fiel em risco",
  ENGAJADO_SUPERFICIAL: "Engajado superficial",
  INATIVO: "Inativo",
  OUTRO_PERFIL: "Outro perfil",
};

export function WhatWeKnow() {
  const { registrarEvento } = useSession();
  const [dados, setDados] = useState<MeDataResponse | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    registrarEvento("OPEN_DATA_PANEL", "what-we-know");
    meApi.buscarDados().then((resposta) => {
      setDados(resposta);
      setCarregando(false);
    });
  }, [registrarEvento]);

  if (carregando || !dados) {
    return (
      <section className="page page-loading" aria-live="polite">
        <span className="loading-mark" aria-hidden="true" />
        <h1>Preparando sua transparência</h1>
        <p>Organizando os dados desta sessão...</p>
      </section>
    );
  }

  return (
    <section className="page page-what-we-know">
      <header className="page-header page-header-split">
        <div>
          <span className="page-kicker">Transparência aplicada</span>
          <h1>O que sabemos sobre você?</h1>
        </div>
        <p className="lead">
          Tudo que este site guarda sobre a sua visita, de forma transparente. Nenhuma dessas informações
          identifica você pessoalmente.
        </p>
      </header>

      <div className="card-grid data-overview-grid">
        <article className="card data-card data-card-featured">
          <span className="data-card-label">Identidade da sessão</span>
          <h3>Identificador anônimo</h3>
          <p className="mono">{dados.userId}</p>
        </article>
        <article className="card data-card">
          <span className="data-card-label">Origem</span>
          <h3>Primeira visita</h3>
          <p>{new Date(dados.createdAt).toLocaleString("pt-BR")}</p>
        </article>
        <article className="card data-card">
          <span className="data-card-label">Recência</span>
          <h3>Última visita</h3>
          <p>{new Date(dados.lastSeenAt).toLocaleString("pt-BR")}</p>
        </article>
        <article className="card data-card">
          <span className="data-card-label">Atividade interna</span>
          <h3>Total de eventos registrados</h3>
          <p className="data-card-number">{dados.totalEvents}</p>
        </article>
      </div>

      {dados.rfv && (
        <section className="rfv-profile-panel">
          <div>
            <span className="page-kicker">Leitura RFV</span>
            <h2>Seu perfil nesta experiência</h2>
            <p>Um código posicional formado apenas pelas interações realizadas dentro da Privora.</p>
          </div>
          <div className="rfv-profile-code">
            <span className="mono rfv-code">{dados.rfv.code}</span>
            <small>R {dados.rfv.recency} · F {dados.rfv.frequency} · V {dados.rfv.value}</small>
          </div>
          <div className="segment-badge">
            <small>Segmento</small>
            <strong>{SEGMENTO_LABEL[dados.rfv.segment] ?? dados.rfv.segment}</strong>
          </div>
        </section>
      )}

      <section className="data-section">
        <div className="section-title-row">
          <div><span className="page-kicker">Escolhas</span><h2>Consentimentos atuais</h2></div>
          <span className="section-count">{dados.consents.length} categorias</span>
        </div>
        <div className="table-shell"><table className="data-table">
        <thead>
          <tr>
            <th>Categoria</th>
            <th>Status</th>
            <th>Atualizado em</th>
          </tr>
        </thead>
        <tbody>
          {dados.consents.map((c) => (
            <tr key={c.category}>
              <td>{c.category}</td>
              <td><span className={`status-pill ${c.granted ? "status-success" : "status-neutral"}`}>{c.granted ? "Concedido" : "Recusado"}</span></td>
              <td>{new Date(c.updatedAt).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
        </table></div>
      </section>

      <section className="data-section">
      <div className="section-title-row"><div><span className="page-kicker">Aprendizado</span><h2>Resultados do quiz</h2></div></div>
      {dados.quizResults.length === 0 ? (
        <p className="empty-state">Você ainda não concluiu o quiz.</p>
      ) : (
        <div className="table-shell"><table className="data-table">
          <thead>
            <tr>
              <th>Pontuação</th>
              <th>Concluído em</th>
            </tr>
          </thead>
          <tbody>
            {dados.quizResults.map((q, i) => (
              <tr key={i}>
                <td>{q.score} / {q.totalQuestions}</td>
                <td>{new Date(q.completedAt).toLocaleString("pt-BR")}</td>
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      </section>

      <section className="data-section">
      <div className="section-title-row">
        <div><span className="page-kicker">Rastro interno</span><h2>Eventos registrados</h2></div>
        <span className="section-count">{dados.events.length} registros</span>
      </div>
      <div className="table-shell"><table className="data-table">
        <thead>
          <tr>
            <th>Evento</th>
            <th>Quando</th>
          </tr>
        </thead>
        <tbody>
          {dados.events.map((e, i) => (
            <tr key={i}>
              <td>{e.eventType}</td>
              <td>{new Date(e.createdAt).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table></div>
      </section>
    </section>
  );
}
