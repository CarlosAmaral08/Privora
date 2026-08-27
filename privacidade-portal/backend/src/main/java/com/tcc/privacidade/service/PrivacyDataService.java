package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.MeDataResponse;
import com.tcc.privacidade.dto.QuizResultResponse;
import com.tcc.privacidade.entity.Event;
import com.tcc.privacidade.entity.UserSession;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Junta dados de varios services para montar o painel "O que sabemos sobre voce?",
 * a exportacao (Art. 18 LGPD - portabilidade) e a exclusao (Art. 18 - eliminacao).
 */
@Service
public class PrivacyDataService {

    private final SessionService sessionService;
    private final ConsentService consentService;
    private final EventService eventService;
    private final QuizService quizService;
    private final RfvService rfvService;

    public PrivacyDataService(SessionService sessionService, ConsentService consentService,
                               EventService eventService, QuizService quizService, RfvService rfvService) {
        this.sessionService = sessionService;
        this.consentService = consentService;
        this.eventService = eventService;
        this.quizService = quizService;
        this.rfvService = rfvService;
    }

    public MeDataResponse montarPainel(UUID userId) {
        UserSession sessao = sessionService.getOrThrow(userId);
        List<Event> eventos = eventService.listar(userId);
        List<MeDataResponse.EventSummary> resumoEventos = eventos.stream()
                .map(e -> new MeDataResponse.EventSummary(e.getEventType().name(), e.getCreatedAt()))
                .toList();

        return new MeDataResponse(
                sessao.getId(),
                sessao.getCreatedAt(),
                sessao.getLastSeenAt(),
                eventos.size(),
                resumoEventos,
                consentService.listar(userId),
                quizService.historico(userId),
                rfvService.buscar(userId).orElse(null)
        );
    }

    /** Mesmo conteudo do painel: e exatamente o que a LGPD chama de portabilidade. */
    public MeDataResponse exportar(UUID userId) {
        return montarPainel(userId);
    }

    /** Apaga tudo relacionado ao usuario, na ordem certa, e por fim a sessao. */
    @Transactional
    public void apagarTudo(UUID userId) {
        eventService.apagarTudo(userId);
        consentService.apagarTudo(userId);
        quizService.apagarTudo(userId);
        rfvService.apagarTudo(userId);
        sessionService.deleteSession(userId);
    }
}
