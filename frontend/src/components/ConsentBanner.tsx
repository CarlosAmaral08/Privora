// Banner de consentimento. Sem "aceitar tudo" em destaque e recusar - as
// três opções (aceitar, recusar, ajustar) têm o mesmo peso visual.

import { useState } from "react";
import { consentApi } from "../services/api";
import { useSession } from "../context/SessionContext";

const CHAVE_JA_DECIDIU = "privacidade-banner-decidido";

export function ConsentBanner() {
  const { recarregarConsentimentos, registrarEvento } = useSession();
  const [visivel, setVisivel] = useState(() => sessionStorage.getItem(CHAVE_JA_DECIDIU) !== "1");

  async function decidir(preferencias: boolean, metricas: boolean) {
    await consentApi.atualizar([
      { category: "NECESSARIOS", granted: true },
      { category: "PREFERENCIAS", granted: preferencias },
      { category: "METRICAS_CAMPANHA", granted: metricas },
    ]);
    await recarregarConsentimentos();
    await registrarEvento("CHANGE_CONSENT");
    sessionStorage.setItem(CHAVE_JA_DECIDIU, "1");
    setVisivel(false);
  }

  if (!visivel) return null;

  return (
    <aside className="consent-banner" aria-label="Preferências de privacidade">
      <div className="consent-banner-copy">
        <span className="consent-shield" aria-hidden="true">P</span>
        <p>
          <strong>Privacidade sob seu controle.</strong>
          Este site usa uma sessão anônima e cookies necessários. Com sua permissão, registra interações
          educativas visíveis em <em>O que sabemos sobre você</em>. Nenhum dado pessoal identificável é coletado.
        </p>
      </div>
      <div className="consent-banner-actions">
        <button onClick={() => decidir(false, false)}>Recusar opcionais</button>
        <button onClick={() => decidir(true, false)}>Só preferências</button>
        <button onClick={() => decidir(true, true)} className="primary">
          Aceitar tudo
        </button>
      </div>
    </aside>
  );
}
