package com.tcc.privacidade.ratelimit;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import com.tcc.privacidade.exception.PolicyAnalysisBusyException;
import org.springframework.stereotype.Component;

import java.util.concurrent.Semaphore;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
public class PolicyAnalysisConcurrencyLimiter {

    private final boolean enabled;
    private final Semaphore semaphore;

    public PolicyAnalysisConcurrencyLimiter(PolicyAnalysisRateLimitProperties properties) {
        this.enabled = properties.enabled();
        this.semaphore = new Semaphore(properties.maxConcurrent(), true);
    }

    public Lease acquire() {
        if (!enabled) return Lease.noop();
        if (!semaphore.tryAcquire()) throw new PolicyAnalysisBusyException();
        return new Lease(semaphore::release);
    }

    public static final class Lease implements AutoCloseable {
        private final Runnable release;
        private final AtomicBoolean closed = new AtomicBoolean();

        private Lease(Runnable release) {
            this.release = release;
        }

        public static Lease noop() {
            return new Lease(() -> { });
        }

        @Override
        public void close() {
            if (closed.compareAndSet(false, true)) release.run();
        }
    }
}
