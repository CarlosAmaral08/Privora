package com.tcc.privacidade.exception;

import com.tcc.privacidade.ratelimit.PolicyAnalysisRateLimiter.LimitScope;

public class PolicyAnalysisRateLimitException extends RuntimeException {

    private final LimitScope scope;
    private final long retryAfterSeconds;

    public PolicyAnalysisRateLimitException(LimitScope scope, long retryAfterSeconds) {
        super("Limite temporario de analises atingido.");
        this.scope = scope;
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public LimitScope getScope() {
        return scope;
    }

    public long getRetryAfterSeconds() {
        return retryAfterSeconds;
    }
}
