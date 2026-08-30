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
      <section className="page">
        <h1>O que sabemos sobre você?</h1>
        <p>Carregando...</p>
      </section>
    );
  }

  return (
    <section className="page page-what-we-know">
      <h1>O que sabemos sobre você?</h1>
      <p className="lead">
        Tudo que este site guarda sobre a sua visita, de forma transparente. Nenhuma dessas informações
        identifica você pessoalmente.
      </p>

      <div className="card-grid">
        <div className="card">
          <h3>Identificador anônimo</h3>
          <p className="mono">{dados.userId}</p>
        </div>
        <div className="card">
          <h3>Primeira visita</h3>
          <p>{new Date(dados.createdAt).toLocaleString("pt-BR")}</p>
        </div>
        <div className="card">
          <h3>Última visita</h3>
          <p>{new Date(dados.lastSeenAt).toLocaleString("pt-BR")}</p>
        </div>
        <div className="card">
          <h3>Total de eventos registrados</h3>
          <p>{dados.totalEvents}</p>
        </div>
      </div>

      {dados.rfv && (
        <div className="card highlight">
          <h3>Seu perfil RFV</h3>
          <p className="mono rfv-code">{dados.rfv.code}</p>
          <p>
            Recência: {dados.rfv.recency} · Frequência: {dados.rfv.frequency} · Valor: {dados.rfv.value}
          </p>
          <p>
            Segmento: <strong>{SEGMENTO_LABEL[dados.rfv.segment] ?? dados.rfv.segment}</strong>
          </p>
        </div>
      )}

      <h2>Consentimentos atuais</h2>
      <table className="data-table">
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
              <td>{c.granted ? "Concedido" : "Recusado"}</td>
              <td>{new Date(c.updatedAt).toLocaleString("pt-BR")}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Resultados do quiz</h2>
      {dados.quizResults.length === 0 ? (
        <p>Você ainda não concluiu o quiz.</p>
      ) : (
        <table className="data-table">
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
        </table>
      )}

      <h2>Eventos registrados</h2>
      <table className="data-table">
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
      </table>
    </section>
  );
}
