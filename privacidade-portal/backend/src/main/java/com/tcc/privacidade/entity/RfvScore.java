package com.tcc.privacidade.entity;

import com.tcc.privacidade.rfv.RfvSegment;
import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Ultimo calculo de RFV (Recencia/Frequencia/Valor) de um usuario.
 * Guardamos so o resultado mais recente - a cada novo evento relevante
 * o servico de RFV recalcula e sobrescreve esta linha.
 */
@Entity
@Table(name = "rfv_score")
public class RfvScore {

    @Id
    private UUID userId;

    @Column(nullable = false)
    private int recency;

    @Column(nullable = false)
    private int frequency;

    @Column(name = "rfv_value", nullable = false)
    private int value;

    @Column(nullable = false, length = 3)
    private String code;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RfvSegment segment;

    @Column(nullable = false)
    private Instant calculatedAt;

    protected RfvScore() { }

    public RfvScore(UUID userId, int recency, int frequency, int value, String code,
                     RfvSegment segment, Instant calculatedAt) {
        this.userId = userId;
        this.recency = recency;
        this.frequency = frequency;
        this.value = value;
        this.code = code;
        this.segment = segment;
        this.calculatedAt = calculatedAt;
    }

    public UUID getUserId() { return userId; }
    public int getRecency() { return recency; }
    public int getFrequency() { return frequency; }
    public int getValue() { return value; }
    public String getCode() { return code; }
    public RfvSegment getSegment() { return segment; }
    public Instant getCalculatedAt() { return calculatedAt; }

    public void update(int recency, int frequency, int value, String code,
                        RfvSegment segment, Instant calculatedAt) {
        this.recency = recency;
        this.frequency = frequency;
        this.value = value;
        this.code = code;
        this.segment = segment;
        this.calculatedAt = calculatedAt;
    }
}
