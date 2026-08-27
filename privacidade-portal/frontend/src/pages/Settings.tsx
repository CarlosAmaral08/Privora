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
      <h1>Configurações de privacidade</h1>

      <h2>Consentimentos</h2>
      <div className="consent-list">
        {consents.map((c) => (
          <label key={c.category} className="consent-item">
            <input
              type="checkbox"
              checked={c.granted}
              disabled={c.category === "NECESSARIOS"}
              onChange={() => alternar(c.category, c.granted)}
            />
            <span>{LABELS[c.category]}</span>
          </label>
        ))}
      </div>

      <h2>Seus dados</h2>
      <div className="settings-actions">
        <button onClick={exportarDados}>Exportar meus dados (JSON)</button>
        <button className="danger" onClick={apagarDados}>
          Apagar todos os meus dados
        </button>
      </div>

      {mensagem && <p className="settings-message">{mensagem}</p>}
    </section>
  );
}
