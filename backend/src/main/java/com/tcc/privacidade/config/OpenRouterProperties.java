package com.tcc.privacidade.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.net.URI;
import java.time.Duration;

@Validated
@ConfigurationProperties(prefix = "openrouter")
public record OpenRouterProperties(
        String apiKey,
        @NotBlank String model,
        @NotNull URI baseUrl,
        @NotNull Duration timeout,
        @Min(256) @Max(10_000) int maxOutputTokens
) {
    public OpenRouterProperties {
        if (timeout != null && (timeout.isZero() || timeout.isNegative())) {
            throw new IllegalArgumentException("openrouter.timeout deve ser positivo");
        }
    }
}
