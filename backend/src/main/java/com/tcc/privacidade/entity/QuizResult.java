package com.tcc.privacidade.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Resultado de uma tentativa do quiz educativo sobre LGPD/privacidade.
 */
@Entity
@Table(name = "quiz_result")
public class QuizResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private int score;

    @Column(nullable = false)
    private int totalQuestions;

    @Column(nullable = false)
    private Instant completedAt;

    protected QuizResult() { }

    public QuizResult(UUID userId, int score, int totalQuestions, Instant completedAt) {
        this.userId = userId;
        this.score = score;
        this.totalQuestions = totalQuestions;
        this.completedAt = completedAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public int getScore() { return score; }
    public int getTotalQuestions() { return totalQuestions; }
    public Instant getCompletedAt() { return completedAt; }
}
