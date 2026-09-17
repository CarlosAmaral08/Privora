package com.tcc.privacidade.ratelimit;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.util.HashMap;
import java.util.Map;

@Component
public class PolicyAnalysisRateLimiter {

    private final PolicyAnalysisRateLimitProperties properties;
    private final Clock clock;
    private final Map<String, ClientUsage> clients = new HashMap<>();
    private final WindowCounter globalDaily = new WindowCounter();
    private long nextCleanupAt;

    public PolicyAnalysisRateLimiter(PolicyAnalysisRateLimitProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public synchronized Decision tryConsume(String clientId) {
        if (!properties.enabled()) return Decision.allow();

        long now = clock.millis();
        cleanupExpiredClients(now);

        ClientUsage client = clients.computeIfAbsent(clientId, ignored -> new ClientUsage());
        client.lastSeenAt = now;
        client.shortWindow.refresh(now, properties.shortWindow().toMillis());
        client.dailyWindow.refresh(now, properties.dailyWindow().toMillis());
        globalDaily.refresh(now, properties.dailyWindow().toMillis());

        boolean globalExceeded = globalDaily.count >= properties.globalDailyRequests();
        boolean shortExceeded = client.shortWindow.count >= properties.shortRequests();
        boolean dailyExceeded = client.dailyWindow.count >= properties.dailyRequests();

        if (globalExceeded || shortExceeded || dailyExceeded) {
            long retryAt = now;
            if (globalExceeded) retryAt = Math.max(retryAt, globalDaily.resetAt(properties.dailyWindow().toMillis()));
            if (shortExceeded) retryAt = Math.max(retryAt, client.shortWindow.resetAt(properties.shortWindow().toMillis()));
            if (dailyExceeded) retryAt = Math.max(retryAt, client.dailyWindow.resetAt(properties.dailyWindow().toMillis()));
            long retryAfterSeconds = Math.max(1, divideRoundingUp(retryAt - now, 1_000));
            return Decision.reject(globalExceeded ? LimitScope.GLOBAL : LimitScope.CLIENT, retryAfterSeconds);
        }

        client.shortWindow.count++;
        client.dailyWindow.count++;
        globalDaily.count++;
        return Decision.allow();
    }

    private void cleanupExpiredClients(long now) {
        if (now < nextCleanupAt) return;
        long expirationAge = properties.dailyWindow().toMillis();
        clients.entrySet().removeIf(entry -> elapsedAtLeast(entry.getValue().lastSeenAt, now, expirationAge));
        long cleanupInterval = Math.min(properties.shortWindow().toMillis(), expirationAge);
        nextCleanupAt = saturatingAdd(now, cleanupInterval);
    }

    private boolean elapsedAtLeast(long start, long now, long duration) {
        return now < start || now - start >= duration;
    }

    private long divideRoundingUp(long dividend, long divisor) {
        return dividend / divisor + (dividend % divisor == 0 ? 0 : 1);
    }

    private long saturatingAdd(long left, long right) {
        if (right > 0 && left > Long.MAX_VALUE - right) return Long.MAX_VALUE;
        return left + right;
    }

    synchronized int trackedClientCount() {
        return clients.size();
    }

    public enum LimitScope {
        CLIENT,
        GLOBAL
    }

    public record Decision(boolean allowed, LimitScope scope, long retryAfterSeconds) {
        public static Decision allow() {
            return new Decision(true, null, 0);
        }

        public static Decision reject(LimitScope scope, long retryAfterSeconds) {
            return new Decision(false, scope, retryAfterSeconds);
        }
    }

    private static final class ClientUsage {
        private final WindowCounter shortWindow = new WindowCounter();
        private final WindowCounter dailyWindow = new WindowCounter();
        private long lastSeenAt;
    }

    private static final class WindowCounter {
        private long startedAt;
        private int count;
        private boolean initialized;

        private void refresh(long now, long duration) {
            if (!initialized || now < startedAt || now - startedAt >= duration) {
                startedAt = now;
                count = 0;
                initialized = true;
            }
        }

        private long resetAt(long duration) {
            if (duration > 0 && startedAt > Long.MAX_VALUE - duration) return Long.MAX_VALUE;
            return startedAt + duration;
        }
    }
}
