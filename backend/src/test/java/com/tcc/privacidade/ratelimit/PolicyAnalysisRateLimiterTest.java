package com.tcc.privacidade.ratelimit;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static com.tcc.privacidade.ratelimit.PolicyAnalysisRateLimiter.LimitScope.CLIENT;
import static com.tcc.privacidade.ratelimit.PolicyAnalysisRateLimiter.LimitScope.GLOBAL;
import static org.assertj.core.api.Assertions.assertThat;

class PolicyAnalysisRateLimiterTest {

    private final MutableClock clock = new MutableClock(Instant.parse("2026-09-17T12:00:00Z"));

    @Test
    void permiteRequestAbaixoDosLimites() {
        PolicyAnalysisRateLimiter limiter = limiter(10, Duration.ofMinutes(10), 30, 200);

        PolicyAnalysisRateLimiter.Decision decision = limiter.tryConsume("192.0.2.10");

        assertThat(decision.allowed()).isTrue();
        assertThat(decision.scope()).isNull();
        assertThat(decision.retryAfterSeconds()).isZero();
    }

    @Test
    void bloqueiaAoExcederLimiteCurtoECalculaRetryAfter() {
        PolicyAnalysisRateLimiter limiter = limiter(2, Duration.ofMinutes(10), 30, 200);

        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        PolicyAnalysisRateLimiter.Decision rejected = limiter.tryConsume("192.0.2.10");

        assertThat(rejected.allowed()).isFalse();
        assertThat(rejected.scope()).isEqualTo(CLIENT);
        assertThat(rejected.retryAfterSeconds()).isEqualTo(600);
    }

    @Test
    void voltaAPermitirQuandoJanelaCurtaExpira() {
        PolicyAnalysisRateLimiter limiter = limiter(1, Duration.ofMinutes(10), 30, 200);

        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isFalse();

        clock.advance(Duration.ofMinutes(10));

        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
    }

    @Test
    void aplicaLimiteDiarioIndividual() {
        PolicyAnalysisRateLimiter limiter = limiter(100, Duration.ofMinutes(10), 2, 200);

        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        PolicyAnalysisRateLimiter.Decision rejected = limiter.tryConsume("192.0.2.10");

        assertThat(rejected.allowed()).isFalse();
        assertThat(rejected.scope()).isEqualTo(CLIENT);
        assertThat(rejected.retryAfterSeconds()).isEqualTo(Duration.ofDays(1).toSeconds());
    }

    @Test
    void aplicaLimiteDiarioGlobal() {
        PolicyAnalysisRateLimiter limiter = limiter(100, Duration.ofMinutes(10), 100, 2);

        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.11").allowed()).isTrue();
        PolicyAnalysisRateLimiter.Decision rejected = limiter.tryConsume("192.0.2.12");

        assertThat(rejected.allowed()).isFalse();
        assertThat(rejected.scope()).isEqualTo(GLOBAL);
        assertThat(rejected.retryAfterSeconds()).isEqualTo(Duration.ofDays(1).toSeconds());
    }

    @Test
    void ipsDiferentesTemLimiteIndividualSeparadoMasCompartilhamOGlobal() {
        PolicyAnalysisRateLimiter limiter = limiter(1, Duration.ofMinutes(10), 30, 3);

        assertThat(limiter.tryConsume("192.0.2.10").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.11").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.10").scope()).isEqualTo(CLIENT);
        assertThat(limiter.tryConsume("192.0.2.12").allowed()).isTrue();
        assertThat(limiter.tryConsume("192.0.2.13").scope()).isEqualTo(GLOBAL);
    }

    @Test
    void removeBucketsDeClientesInativosDepoisDaJanelaDiaria() {
        PolicyAnalysisRateLimiter limiter = limiter(10, Duration.ofMinutes(10), 30, 200);
        limiter.tryConsume("192.0.2.10");
        assertThat(limiter.trackedClientCount()).isEqualTo(1);

        clock.advance(Duration.ofDays(1));
        limiter.tryConsume("192.0.2.11");

        assertThat(limiter.trackedClientCount()).isEqualTo(1);
    }

    private PolicyAnalysisRateLimiter limiter(
            int shortRequests,
            Duration shortWindow,
            int dailyRequests,
            int globalDailyRequests
    ) {
        PolicyAnalysisRateLimitProperties properties = new PolicyAnalysisRateLimitProperties(
                true,
                shortRequests,
                shortWindow,
                dailyRequests,
                Duration.ofDays(1),
                globalDailyRequests,
                3,
                false
        );
        return new PolicyAnalysisRateLimiter(properties, clock);
    }

    private static final class MutableClock extends Clock {
        private Instant instant;

        private MutableClock(Instant instant) {
            this.instant = instant;
        }

        private void advance(Duration duration) {
            instant = instant.plus(duration);
        }

        @Override
        public ZoneId getZone() {
            return ZoneOffset.UTC;
        }

        @Override
        public Clock withZone(ZoneId zone) {
            return this;
        }

        @Override
        public Instant instant() {
            return instant;
        }
    }
}
