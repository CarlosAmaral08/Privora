package com.tcc.privacidade.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Um evento e um "log" de algo que o usuario fez no site
 * (ex: abriu o painel de dados, terminou o quiz).
 * E a partir desses eventos que calculamos o RFV depois.
 */
@Entity
@Table(name = "app_event")
public class Event {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private UUID userId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private EventType eventType;

    @Column(columnDefinition = "CLOB")
    private String metadataJson;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected Event() { }

    public Event(UUID userId, EventType eventType, String metadataJson, Instant createdAt) {
        this.userId = userId;
        this.eventType = eventType;
        this.metadataJson = metadataJson;
        this.createdAt = createdAt;
    }

    public UUID getId() { return id; }
    public UUID getUserId() { return userId; }
    public EventType getEventType() { return eventType; }
    public String getMetadataJson() { return metadataJson; }
    public Instant getCreatedAt() { return createdAt; }
}
