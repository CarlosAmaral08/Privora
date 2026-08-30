package com.tcc.privacidade.rfv;

/**
 * Resultado de um calculo de RFV. E um "record" (recurso do Java moderno):
 * uma classe imutavel que so guarda dados, sem precisar escrever
 * getters/construtor na mao - o Java gera tudo isso sozinho.
 */
public record RfvScoreResult(
        int recency,
        int frequency,
        int value,
        String code,
        RfvSegment segment
) {}
