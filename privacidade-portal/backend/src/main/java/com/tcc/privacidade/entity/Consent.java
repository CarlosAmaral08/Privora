package com.tcc.privacidade.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Guarda se o usuario aceitou ou nao uma categoria de consentimento
 * (ex: "preferencias" = true, "metricas" = false).
 * Uma linha por categoria por usuario.
 */
@Entity
@Table(name = "consent", uniqueConstraints = @UniqueConstraint(columnNames = {"userId", "category"}))
public class Consent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ConsentCategory category;

    @Column(nullable = false)
    private boolean granted;

    @Column(nullable = false)
    private Instant updatedAt;

    protected Consent() { }

    public Consent(UUID userId, ConsentCategory category, boolean granted, Instant updatedAt) {
        this.userId = userId;
        this.category = category;
        this.granted = granted;
        this.updatedAt = updatedAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public ConsentCategory getCategory() { return category; }
    public boolean isGranted() { return granted; }
    public Instant getUpdatedAt() { return updatedAt; }

    public void setGranted(boolean granted) { this.granted = granted; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
