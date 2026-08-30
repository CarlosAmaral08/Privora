package com.tcc.privacidade.dto;

import com.tcc.privacidade.entity.EventType;
import jakarta.validation.constraints.NotNull;

public record EventRequest(@NotNull EventType eventType, String metadataJson) {}
