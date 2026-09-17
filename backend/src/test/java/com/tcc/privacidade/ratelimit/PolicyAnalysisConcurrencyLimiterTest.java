package com.tcc.privacidade.ratelimit;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import com.tcc.privacidade.exception.PolicyAnalysisBusyException;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PolicyAnalysisConcurrencyLimiterTest {

    @Test
    void recusaNovaAnaliseQuandoTodasAsVagasEstaoOcupadas() {
        PolicyAnalysisConcurrencyLimiter limiter = limiter(1);

        try (PolicyAnalysisConcurrencyLimiter.Lease ignored = limiter.acquire()) {
            assertThatThrownBy(limiter::acquire).isInstanceOf(PolicyAnalysisBusyException.class);
        }
    }

    @Test
    void liberaVagaAoFecharLeaseMesmoAposExcecao() {
        PolicyAnalysisConcurrencyLimiter limiter = limiter(1);

        assertThatThrownBy(() -> {
            try (PolicyAnalysisConcurrencyLimiter.Lease ignored = limiter.acquire()) {
                throw new RuntimeException("timeout simulado");
            }
        }).isInstanceOf(RuntimeException.class);

        assertThatCode(() -> {
            try (PolicyAnalysisConcurrencyLimiter.Lease ignored = limiter.acquire()) {
                // A vaga foi devolvida pelo finally implicito do try-with-resources.
            }
        }).doesNotThrowAnyException();
    }

    @Test
    void fecharLeaseDuasVezesNaoCriaVagaExtra() {
        PolicyAnalysisConcurrencyLimiter limiter = limiter(1);
        PolicyAnalysisConcurrencyLimiter.Lease first = limiter.acquire();
        first.close();
        first.close();

        try (PolicyAnalysisConcurrencyLimiter.Lease ignored = limiter.acquire()) {
            assertThatThrownBy(limiter::acquire).isInstanceOf(PolicyAnalysisBusyException.class);
        }
    }

    private PolicyAnalysisConcurrencyLimiter limiter(int maxConcurrent) {
        PolicyAnalysisRateLimitProperties properties = new PolicyAnalysisRateLimitProperties(
                true,
                10,
                Duration.ofMinutes(10),
                30,
                Duration.ofDays(1),
                200,
                maxConcurrent,
                false
        );
        return new PolicyAnalysisConcurrencyLimiter(properties);
    }
}
