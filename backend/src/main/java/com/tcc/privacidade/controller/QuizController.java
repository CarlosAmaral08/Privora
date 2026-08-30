package com.tcc.privacidade.controller;

import com.tcc.privacidade.config.SessionCookieUtil;
import com.tcc.privacidade.dto.QuizResultResponse;
import com.tcc.privacidade.dto.QuizSubmitRequest;
import com.tcc.privacidade.exception.NoSessionException;
import com.tcc.privacidade.service.QuizService;
import com.tcc.privacidade.service.RfvService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/quiz")
public class QuizController {

    private final QuizService quizService;
    private final RfvService rfvService;
    private final SessionCookieUtil cookieUtil;

    public QuizController(QuizService quizService, RfvService rfvService, SessionCookieUtil cookieUtil) {
        this.quizService = quizService;
        this.rfvService = rfvService;
        this.cookieUtil = cookieUtil;
    }

    @PostMapping
    public QuizResultResponse enviar(HttpServletRequest request, @Valid @RequestBody QuizSubmitRequest body) {
        UUID userId = cookieUtil.lerUserId(request);
        if (userId == null) {
            throw new NoSessionException();
        }
        QuizResultResponse resultado = quizService.registrarResultado(userId, body);
        rfvService.recalcular(userId);
        return resultado;
    }
}
