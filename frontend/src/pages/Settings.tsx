import { useEffect, useState } from "react";
import { consentApi, meApi } from "../services/api";
import { useSession } from "../context/SessionContext";
import type { ConsentCategory } from "../types/api";

const LABELS: Record<ConsentCategory, string> = {
  NECESSARIOS: "Necessários (sempre ativos, mantêm a sessão funcionando)",
  PREFERENCIAS: "Preferências (lembrar escolhas de navegação)",
  METRICAS_CAMPANHA: "Métricas da campanha (eventos usados no painel e no dashboard)",
};

export function Settings() {
  const { consents, recarregarConsentimentos, registrarEvento } = useSession();
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    registrarEvento("OPEN_PRIVACY_SETTINGS", "settings-page");
  }, [registrarEvento]);

  async function alternar(category: ConsentCategory, atual: boolean) {
    if (category === "NECESSARIOS") return;
    await consentApi.atualizar([{ category, granted: !atual }]);
    await recarregarConsentimentos();
    await registrarEvento("CHANGE_CONSENT", category);
  }

  async function exportarDados() {
    const dados = await meApi.exportar();
    await registrarEvento("EXPORT_DATA");
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "meus-dados.json";
    a.click();
    URL.revokeObjectURL(url);
    setMensagem("Seus dados foram exportados em meus-dados.json");
  }

  async function apagarDados() {
    const confirmar = window.confirm(
      "Isso vai apagar permanentemente sua sessão, consentimentos, eventos e resultados de quiz. Continuar?"
    );
    if (!confirmar) return;
    await registrarEvento("DELETE_DATA");
    await meApi.apagar();
    setMensagem("Seus dados foram apagados. Recarregue a página para começar uma nova sessão anônima.");
  }

  return (
    <section className="page page-settings">
      <header className="page-header">
        <span className="page-kicker">Suas escolhas</span>
        <h1>Configurações de privacidade</h1>
        <p className="lead">Revise consentimentos e exerça controle sobre os dados desta sessão anônima.</p>
      </header>

      <section className="content-panel settings-panel">
        <div className="panel-heading panel-heading-between">
          <div>
            <span className="page-kicker">Controle granular</span>
            <h2>Consentimentos</h2>
          </div>
          <span className="settings-state">Alterações imediatas</span>
        </div>
        <div className="consent-list">
          {consents.map((c) => (
            <label key={c.category} className="consent-item">
              <span className="consent-copy">
                <strong>{c.category === "NECESSARIOS" ? "Necessários" : c.category === "PREFERENCIAS" ? "Preferências" : "Métricas da campanha"}</strong>
                <small>{LABELS[c.category].replace(/^[^(]+\(|\)$/g, "")}</small>
              </span>
              <span className="switch-control">
                <input
                  type="checkbox"
                  checked={c.granted}
                  disabled={c.category === "NECESSARIOS"}
                  aria-label={`${LABELS[c.category]}: ${c.granted ? "ativado" : "desativado"}`}
                  onChange={() => alternar(c.category, c.granted)}
                />
                <span className="switch-track" aria-hidden="true"><span /></span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="content-panel data-actions-panel">
        <div className="panel-heading">
          <span className="panel-icon panel-icon-violet" aria-hidden="true">↗</span>
          <div><span className="page-kicker">Portabilidade e exclusão</span><h2>Seus dados</h2></div>
        </div>
        <p>Baixe uma cópia legível ou remova permanentemente todos os registros vinculados a esta sessão.</p>
        <div className="settings-actions">
          <button className="action-button" onClick={exportarDados}>Exportar meus dados <span>JSON ↗</span></button>
          <button className="action-button danger" onClick={apagarDados}>Apagar todos os meus dados <span>Irreversível</span></button>
        </div>
      </section>

      {mensagem && <p className="settings-message" role="status"><span aria-hidden="true">✓</span>{mensagem}</p>}
    </section>
  );
}
