// Contexto global: guarda a sessão do usuário e os consentimentos atuais,
// pra qualquer página/componente acessar sem precisar rebuscar toda hora.

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { consentApi, eventApi, sessionApi } from "../services/api";
import type { ConsentDto, EventType, SessionResponse } from "../types/api";

interface SessionContextValue {
  session: SessionResponse | null;
  consents: ConsentDto[];
  carregando: boolean;
  recarregarConsentimentos: () => Promise<void>;
  registrarEvento: (eventType: EventType, metadataJson?: string) => Promise<void>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [consents, setConsents] = useState<ConsentDto[]>([]);
  const [carregando, setCarregando] = useState(true);

  const recarregarConsentimentos = useCallback(async () => {
    const lista = await consentApi.listar();
    setConsents(lista);
  }, []);

  useEffect(() => {
    (async () => {
      const sessaoAberta = await sessionApi.abrir();
      setSession(sessaoAberta);
      await recarregarConsentimentos();
      setCarregando(false);
    })();
  }, [recarregarConsentimentos]);

  // O backend também valida consentimento, mas registrar aqui já evita
  // uma chamada de rede desnecessária quando METRICAS_CAMPANHA está desligado.
  const registrarEvento = useCallback(
    async (eventType: EventType, metadataJson?: string) => {
      await eventApi.registrar(eventType, metadataJson);
    },
    []
  );

  return (
    <SessionContext.Provider value={{ session, consents, carregando, recarregarConsentimentos, registrarEvento }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession precisa estar dentro de <SessionProvider>");
  return ctx;
}
