package com.tcc.privacidade.entity;

/**
 * As tres categorias de consentimento do portal.
 * NECESSARIOS nao pode ser desligado (o site nao funciona sem sessao).
 */
public enum ConsentCategory {
    NECESSARIOS,
    PREFERENCIAS,
    METRICAS_CAMPANHA
}
