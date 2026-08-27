package com.tcc.privacidade.rfv;

import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;

/**
 * Implementacao padrao do calculo de RFV.
 *
 * IMPORTANTE: nao somamos R + F + V. Cada um vira um digito (1 a 5) e
 * juntamos como texto: "R" + "F" + "V" -> ex: "555", "155".
 * A posicao importa (155 != 551), igual permissao de arquivo no Linux (rwx).
 */
@Component
public class DefaultRfvCalculator implements RfvCalculator {

    private static final Map<String, RfvSegment> SEGMENTOS_CONHECIDOS = Map.of(
            "555", RfvSegment.CAMPEAO,
            "511", RfvSegment.RECEM_CHEGADO,
            "155", RfvSegment.FIEL_EM_RISCO,
            "551", RfvSegment.ENGAJADO_SUPERFICIAL,
            "111", RfvSegment.INATIVO
    );

    @Override
    public RfvScoreResult calculate(UserActivitySnapshot activity) {
        int recency = calcularRecencia(activity.lastRelevantEventAt());
        int frequency = calcularFrequencia(activity.relevantEventCount());
        int value = clamp(activity.deepestActionLevel(), 1, 5);

        String code = "" + recency + frequency + value;
        RfvSegment segment = SEGMENTOS_CONHECIDOS.getOrDefault(code, RfvSegment.OUTRO_PERFIL);

        return new RfvScoreResult(recency, frequency, value, code, segment);
    }

    private int calcularRecencia(Instant lastRelevantEventAt) {
        if (lastRelevantEventAt == null) {
            return 1; // nunca fez nada relevante -> pior nota de recencia
        }
        long dias = Duration.between(lastRelevantEventAt, Instant.now()).toDays();
        if (dias <= 7) return 5;
        if (dias <= 30) return 4;
        if (dias <= 60) return 3;
        if (dias <= 90) return 2;
        return 1;
    }

    private int calcularFrequencia(long relevantEventCount) {
        if (relevantEventCount >= 8) return 5;
        if (relevantEventCount >= 6) return 4;
        if (relevantEventCount >= 3) return 3;
        if (relevantEventCount >= 1) return 2;
        return 1;
    }

    private int clamp(int valor, int min, int max) {
        return Math.max(min, Math.min(max, valor));
    }
}
