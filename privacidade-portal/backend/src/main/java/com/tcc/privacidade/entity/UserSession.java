package com.tcc.privacidade.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Representa um "visitante anonimo" do site.
 * Nao guarda nome, email ou qualquer dado pessoal - so um UUID aleatorio
 * gerado na primeira visita, que volta a ser reconhecido via cookie.
 */
@Entity
@Table(name = "user_session")
public class UserSession {

    @Id
    private UUID id;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant lastSeenAt;

    protected UserSession() {
        // construtor vazio exigido pelo JPA
    }

    public UserSession(UUID id, Instant createdAt, Instant lastSeenAt) {
        this.id = id;
        this.createdAt = createdAt;
        this.lastSeenAt = lastSeenAt;
    }

    public UUID getId() { return id; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getLastSeenAt() { return lastSeenAt; }
    public void setLastSeenAt(Instant lastSeenAt) { this.lastSeenAt = lastSeenAt; }
}
