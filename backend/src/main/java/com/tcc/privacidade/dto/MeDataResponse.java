package com.tcc.privacidade.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

// Tudo que o painel "O que sabemos sobre voce?" mostra
public record MeDataResponse(
        UUID userId,
        Instant createdAt,
        Instant lastSeenAt,
        long totalEvents,
        List<EventSummary> events,
        List<ConsentDto> consents,
        List<QuizResultResponse> quizResults,
        RfvResponse rfv
) {
    public record EventSummary(String eventType, Instant createdAt) {}
}
