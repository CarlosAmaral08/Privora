package com.tcc.privacidade.config;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "privora.rate-limit")
public record PolicyAnalysisRateLimitProperties(
        boolean enabled,
        @Min(1) int shortRequests,
        @NotNull Duration shortWindow,
        @Min(1) int dailyRequests,
        @NotNull Duration dailyWindow,
        @Min(1) int globalDailyRequests,
        @Min(1) int maxConcurrent,
        boolean trustCloudflareIp
) {
    public PolicyAnalysisRateLimitProperties {
        requirePositive(shortWindow, "privora.rate-limit.short-window");
        requirePositive(dailyWindow, "privora.rate-limit.daily-window");
    }

    private static void requirePositive(Duration duration, String property) {
        if (duration != null && (duration.isZero() || duration.isNegative())) {
            throw new IllegalArgumentException(property + " deve ser positivo");
        }
    }
}
