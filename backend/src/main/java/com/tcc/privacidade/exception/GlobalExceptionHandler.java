package com.tcc.privacidade.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.Map;

import static com.tcc.privacidade.ratelimit.PolicyAnalysisRateLimiter.LimitScope.GLOBAL;

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
        return corpo(HttpStatus.BAD_REQUEST, "Dados invalidos.");
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Object> corpoInvalido(HttpMessageNotReadableException ex) {
        return corpo(HttpStatus.BAD_REQUEST, "Corpo da requisicao invalido.");
    }

    @ExceptionHandler(PolicyAnalysisProviderException.class)
    public ResponseEntity<Object> provedorAnalise(PolicyAnalysisProviderException ex) {
        return switch (ex.getReason()) {
            case NOT_CONFIGURED -> corpo(HttpStatus.SERVICE_UNAVAILABLE, "Servico de analise indisponivel.");
            case TIMEOUT -> corpo(HttpStatus.GATEWAY_TIMEOUT, "O provedor de analise excedeu o tempo limite.");
            case UNAVAILABLE, INVALID_RESPONSE ->
                    corpo(HttpStatus.BAD_GATEWAY, "Nao foi possivel obter uma analise valida do provedor.");
        };
    }

    @ExceptionHandler(PolicyAnalysisRateLimitException.class)
    public ResponseEntity<Object> limiteAnalise(PolicyAnalysisRateLimitException ex) {
        String message = ex.getScope() == GLOBAL
                ? "O limite temporario de analises da Privora foi atingido. Tente novamente mais tarde."
                : "Muitas analises foram solicitadas. Tente novamente mais tarde.";
        return corpoComRetryAfter(HttpStatus.TOO_MANY_REQUESTS, message, ex.getRetryAfterSeconds());
    }

    @ExceptionHandler(PolicyAnalysisBusyException.class)
    public ResponseEntity<Object> analiseOcupada(PolicyAnalysisBusyException ex) {
        return corpoComRetryAfter(HttpStatus.SERVICE_UNAVAILABLE,
                "O servico de analise esta ocupado. Tente novamente em instantes.", 1);
    }

    private ResponseEntity<Object> corpo(HttpStatus status, String mensagem) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "message", mensagem
        ));
    }

    private ResponseEntity<Object> corpoComRetryAfter(HttpStatus status, String mensagem, long retryAfterSeconds) {
        return ResponseEntity.status(status)
                .header(HttpHeaders.RETRY_AFTER, Long.toString(Math.max(1, retryAfterSeconds)))
                .body(Map.of(
                        "timestamp", Instant.now().toString(),
                        "status", status.value(),
                        "message", mensagem
                ));
    }
}
