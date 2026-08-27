package com.tcc.privacidade.exception;

/** Lancada quando uma rota que precisa de sessao e chamada sem o cookie valido. */
public class NoSessionException extends RuntimeException {
    public NoSessionException() {
        super("Nenhuma sessao ativa. Chame POST /api/session primeiro.");
    }
}
