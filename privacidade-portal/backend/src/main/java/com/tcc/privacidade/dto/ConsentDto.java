package com.tcc.privacidade.dto;

import com.tcc.privacidade.entity.ConsentCategory;
import java.time.Instant;

public record ConsentDto(ConsentCategory category, boolean granted, Instant updatedAt) {}
