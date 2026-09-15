package com.tcc.privacidade.exception;

public class PolicyAnalysisProviderException extends RuntimeException {

    public enum Reason {
        NOT_CONFIGURED,
        TIMEOUT,
        UNAVAILABLE,
        INVALID_RESPONSE
    }

    private final Reason reason;

    public PolicyAnalysisProviderException(Reason reason, String message) {
        super(message);
        this.reason = reason;
    }

    public PolicyAnalysisProviderException(Reason reason, String message, Throwable cause) {
        super(message, cause);
        this.reason = reason;
    }

    public Reason getReason() {
        return reason;
    }
}
