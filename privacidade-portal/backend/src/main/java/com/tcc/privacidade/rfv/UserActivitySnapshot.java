package com.tcc.privacidade.rfv;

import java.time.Instant;

/**
 * "Foto" da atividade de um usuario no momento do calculo do RFV.
 * E o que passamos para o RfvCalculator - ele nao sabe nada sobre
 * banco de dados, so trabalha com esses numeros.
 *
 * @param lastRelevantEventAt data do evento relevante mais recente (para Recencia)
 * @param relevantEventCount  quantidade de eventos relevantes na janela considerada (para Frequencia)
 * @param deepestActionLevel  nivel da acao mais "profunda" ja feita, de 1 a 5 (para Valor)
 */
public record UserActivitySnapshot(
        Instant lastRelevantEventAt,
        long relevantEventCount,
        int deepestActionLevel
) {}
