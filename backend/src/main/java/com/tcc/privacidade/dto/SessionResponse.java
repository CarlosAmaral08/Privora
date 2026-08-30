package com.tcc.privacidade.dto;

import java.time.Instant;
import java.util.UUID;

// DTO = "Data Transfer Object". E o formato que devolvemos para o frontend.
// Nunca devolvemos a entidade JPA direto, so o que o front realmente precisa.
public record SessionResponse(UUID userId, Instant createdAt, Instant lastSeenAt) {}
