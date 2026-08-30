package com.tcc.privacidade.controller;

import com.tcc.privacidade.config.SessionCookieUtil;
import com.tcc.privacidade.dto.MeDataResponse;
import com.tcc.privacidade.dto.RfvResponse;
import com.tcc.privacidade.dto.SessionResponse;
import com.tcc.privacidade.entity.UserSession;
import com.tcc.privacidade.exception.NoSessionException;
import com.tcc.privacidade.service.PrivacyDataService;
import com.tcc.privacidade.service.RfvService;
import com.tcc.privacidade.service.SessionService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api")
public class MeController {

    private final SessionCookieUtil cookieUtil;
    private final SessionService sessionService;
    private final PrivacyDataService privacyDataService;
    private final RfvService rfvService;

    public MeController(SessionCookieUtil cookieUtil, SessionService sessionService,
                         PrivacyDataService privacyDataService, RfvService rfvService) {
        this.cookieUtil = cookieUtil;
        this.sessionService = sessionService;
        this.privacyDataService = privacyDataService;
        this.rfvService = rfvService;
    }

    @GetMapping("/me")
    public SessionResponse me(HttpServletRequest request) {
        UUID userId = exigirUserId(request);
        UserSession sessao = sessionService.getOrThrow(userId);
        return new SessionResponse(sessao.getId(), sessao.getCreatedAt(), sessao.getLastSeenAt());
    }

    @GetMapping("/me/data")
    public MeDataResponse meusDados(HttpServletRequest request) {
        return privacyDataService.montarPainel(exigirUserId(request));
    }

    @GetMapping("/me/rfv")
    public RfvResponse meuRfv(HttpServletRequest request) {
        UUID userId = exigirUserId(request);
        return rfvService.buscar(userId).orElseGet(() -> rfvService.recalcular(userId));
    }

    @GetMapping("/export")
    public MeDataResponse exportar(HttpServletRequest request) {
        return privacyDataService.exportar(exigirUserId(request));
    }

    @DeleteMapping("/me")
    public void apagar(HttpServletRequest request, HttpServletResponse response) {
        UUID userId = exigirUserId(request);
        privacyDataService.apagarTudo(userId);
        cookieUtil.apagarCookie(response);
    }

    private UUID exigirUserId(HttpServletRequest request) {
        UUID userId = cookieUtil.lerUserId(request);
        if (userId == null) {
            throw new NoSessionException();
        }
        return userId;
    }
}
