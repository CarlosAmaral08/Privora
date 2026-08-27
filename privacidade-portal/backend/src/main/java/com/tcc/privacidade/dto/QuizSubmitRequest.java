package com.tcc.privacidade.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record QuizSubmitRequest(@NotNull @Min(0) Integer score, @NotNull @Min(1) Integer totalQuestions) {}
