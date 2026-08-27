package com.tcc.privacidade.controller;

import com.tcc.privacidade.config.SessionCookieUtil;
import com.tcc.privacidade.dto.EventRequest;
import com.tcc.privacidade.dto.RfvResponse;
import com.tcc.privacidade.exception.NoSessionException;
import com.tcc.privacidade.service.EventService;
import com.tcc.privacidade.service.RfvService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final RfvService rfvService;
    private final SessionCookieUtil cookieUtil;

    public EventController(EventService eventService, RfvService rfvService, SessionCookieUtil cookieUtil) {
        this.eventService = eventService;
        this.rfvService = rfvService;
        this.cookieUtil = cookieUtil;
    }

    /** Registra um evento e recalcula o RFV na hora (o dashboard fica sempre atualizado). */
    @PostMapping
    public RfvResponse registrar(HttpServletRequest request, @Valid @RequestBody EventRequest body) {
        UUID userId = cookieUtil.lerUserId(request);
        if (userId == null) {
            throw new NoSessionException();
        }
        eventService.registrar(userId, body);
        return rfvService.recalcular(userId);
    }
}
