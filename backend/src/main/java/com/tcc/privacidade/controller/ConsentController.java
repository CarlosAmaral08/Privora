package com.tcc.privacidade.controller;

import com.tcc.privacidade.config.SessionCookieUtil;
import com.tcc.privacidade.dto.ConsentDto;
import com.tcc.privacidade.dto.ConsentUpdateRequest;
import com.tcc.privacidade.exception.NoSessionException;
import com.tcc.privacidade.service.ConsentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/consents")
public class ConsentController {

    private final ConsentService consentService;
    private final SessionCookieUtil cookieUtil;

    public ConsentController(ConsentService consentService, SessionCookieUtil cookieUtil) {
        this.consentService = consentService;
        this.cookieUtil = cookieUtil;
    }

    @GetMapping
    public List<ConsentDto> listar(HttpServletRequest request) {
        return consentService.listar(exigirUserId(request));
    }

    @PutMapping
    public List<ConsentDto> atualizar(HttpServletRequest request, @Valid @RequestBody ConsentUpdateRequest body) {
        return consentService.atualizar(exigirUserId(request), body);
    }

    private UUID exigirUserId(HttpServletRequest request) {
        UUID userId = cookieUtil.lerUserId(request);
        if (userId == null) {
            throw new NoSessionException();
        }
        return userId;
    }
}
