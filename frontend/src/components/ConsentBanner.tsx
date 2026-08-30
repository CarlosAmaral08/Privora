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
    <div className="consent-banner">
      <p>
        Este site usa apenas uma sessão anônima e cookies estritamente necessários. Com sua permissão,
        também registramos algumas interações para fins educativos (veja em <em>O que sabemos sobre você</em>).
        Nenhum dado pessoal identificável é coletado.
      </p>
      <div className="consent-banner-actions">
        <button onClick={() => decidir(false, false)}>Recusar opcionais</button>
        <button onClick={() => decidir(true, false)}>Só preferências</button>
        <button onClick={() => decidir(true, true)} className="primary">
          Aceitar tudo
        </button>
      </div>
    </div>
  );
}
