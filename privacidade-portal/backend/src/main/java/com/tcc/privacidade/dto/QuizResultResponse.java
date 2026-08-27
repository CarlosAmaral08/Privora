package com.tcc.privacidade.dto;

import java.time.Instant;

public record QuizResultResponse(int score, int totalQuestions, Instant completedAt) {}
