package com.tcc.privacidade.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

@Configuration
public class RateLimitConfig {

    @Bean
    public Clock rateLimitClock() {
        return Clock.systemUTC();
    }
}
