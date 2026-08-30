package com.tcc.privacidade.controller;

import com.tcc.privacidade.config.SessionCookieUtil;
import com.tcc.privacidade.dto.SessionResponse;
import com.tcc.privacidade.entity.UserSession;
import com.tcc.privacidade.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/session")
public class SessionController {

    private final SessionService sessionService;
    private final SessionCookieUtil cookieUtil;

    public SessionController(SessionService sessionService, SessionCookieUtil cookieUtil) {
        this.sessionService = sessionService;
        this.cookieUtil = cookieUtil;
    }

    /**
     * Chamado pelo frontend assim que a pagina carrega.
     * Cria uma sessao anonima nova ou reconhece a existente pelo cookie.
     */
    @PostMapping
    public SessionResponse abrirSessao(HttpServletRequest request, HttpServletResponse response) {
        UUID userId = cookieUtil.lerUserId(request);
        UserSession sessao = sessionService.resolveSession(userId);
        cookieUtil.escreverCookie(response, sessao.getId());
        return new SessionResponse(sessao.getId(), sessao.getCreatedAt(), sessao.getLastSeenAt());
    }
}
