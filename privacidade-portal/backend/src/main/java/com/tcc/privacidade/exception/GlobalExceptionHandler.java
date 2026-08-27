package com.tcc.privacidade.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

/**
 * Centraliza o tratamento de erros: em vez de cada controller devolver
 * uma resposta diferente, tudo cai aqui e vira um JSON padronizado.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(NoSessionException.class)
    public ResponseEntity<Object> semSessao(NoSessionException ex) {
        return corpo(HttpStatus.UNAUTHORIZED, ex.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Object> estadoInvalido(IllegalStateException ex) {
        return corpo(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> validacao(MethodArgumentNotValidException ex) {
        return corpo(HttpStatus.BAD_REQUEST, "Dados invalidos: " + ex.getMessage());
    }

    private ResponseEntity<Object> corpo(HttpStatus status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "message", mensagem
        ));
    }
}
