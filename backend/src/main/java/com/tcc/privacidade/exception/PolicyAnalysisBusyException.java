package com.tcc.privacidade.exception;

public class PolicyAnalysisBusyException extends RuntimeException {

    public PolicyAnalysisBusyException() {
        super("Todas as vagas de analise estao ocupadas.");
    }
}
