package com.tcc.privacidade.entity;

/**
 * Todos os tipos de acao que registramos sobre um usuario anonimo.
 * Usar enum aqui evita erros de digitacao (string solta tipo "view_content").
 */
public enum EventType {
    VIEW_CONTENT,
    OPEN_DATA_PANEL,
    COMPLETE_QUIZ,
    OPEN_PRIVACY_SETTINGS,
    CHANGE_CONSENT,
    EXPORT_DATA,
    DELETE_DATA,
    VIEW_RIGHTS_SECTION,
    VIEW_COLLECTED_DATA_SECTION
}
