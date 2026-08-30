package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.RfvResponse;
import com.tcc.privacidade.entity.Event;
import com.tcc.privacidade.entity.EventType;
import com.tcc.privacidade.entity.RfvScore;
import com.tcc.privacidade.repository.EventRepository;
import com.tcc.privacidade.repository.RfvScoreRepository;
import com.tcc.privacidade.rfv.RfvCalculator;
import com.tcc.privacidade.rfv.RfvScoreResult;
import com.tcc.privacidade.rfv.UserActivitySnapshot;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Monta a "foto" de atividade do usuario (UserActivitySnapshot) a partir
 * dos eventos gravados e manda para o RfvCalculator calcular o RFV.
 * Esta classe conhece o banco; o RfvCalculator, nao (fica isolado, como pede o enunciado).
 */
@Service
public class RfvService {

    // nivel de "profundidade" de cada tipo de evento, para o V (Valor) do RFV
    private static final int NIVEL_VIEW_CONTENT = 1;
    private static final int NIVEL_OPEN_DATA_PANEL = 2;
    private static final int NIVEL_COMPLETE_QUIZ = 3;
    private static final int NIVEL_OPEN_PRIVACY_SETTINGS = 4;
    private static final int NIVEL_ACAO_PRATICA = 5; // CHANGE_CONSENT, EXPORT_DATA, DELETE_DATA

    private final EventRepository eventRepository;
    private final RfvScoreRepository rfvScoreRepository;
    private final RfvCalculator rfvCalculator;

    public RfvService(EventRepository eventRepository, RfvScoreRepository rfvScoreRepository,
                       RfvCalculator rfvCalculator) {
        this.eventRepository = eventRepository;
        this.rfvScoreRepository = rfvScoreRepository;
        this.rfvCalculator = rfvCalculator;
    }

    /** Recalcula e persiste o RFV do usuario. Chamado sempre que um evento novo e registrado. */
    public RfvResponse recalcular(UUID userId) {
        List<Event> eventos = eventRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Instant ultimoEvento = eventos.isEmpty() ? null : eventos.get(0).getCreatedAt();
        long totalEventos = eventos.size();
        int nivelMaisProfundo = eventos.stream()
                .mapToInt(e -> nivelDoEvento(e.getEventType()))
                .max()
                .orElse(1);

        UserActivitySnapshot snapshot = new UserActivitySnapshot(ultimoEvento, totalEventos, nivelMaisProfundo);
        RfvScoreResult resultado = rfvCalculator.calculate(snapshot);

        RfvScore score = rfvScoreRepository.findById(userId)
                .map(existente -> {
                    existente.update(resultado.recency(), resultado.frequency(), resultado.value(),
                            resultado.code(), resultado.segment(), Instant.now());
                    return existente;
                })
                .orElseGet(() -> new RfvScore(userId, resultado.recency(), resultado.frequency(),
                        resultado.value(), resultado.code(), resultado.segment(), Instant.now()));

        rfvScoreRepository.save(score);
        return toResponse(score);
    }

    public Optional<RfvResponse> buscar(UUID userId) {
        return rfvScoreRepository.findById(userId).map(this::toResponse);
    }

    public void apagarTudo(UUID userId) {
        rfvScoreRepository.deleteByUserId(userId);
    }

    private int nivelDoEvento(EventType tipo) {
        return switch (tipo) {
            case VIEW_CONTENT, VIEW_RIGHTS_SECTION, VIEW_COLLECTED_DATA_SECTION -> NIVEL_VIEW_CONTENT;
            case OPEN_DATA_PANEL -> NIVEL_OPEN_DATA_PANEL;
            case COMPLETE_QUIZ -> NIVEL_COMPLETE_QUIZ;
            case OPEN_PRIVACY_SETTINGS -> NIVEL_OPEN_PRIVACY_SETTINGS;
            case CHANGE_CONSENT, EXPORT_DATA, DELETE_DATA -> NIVEL_ACAO_PRATICA;
        };
    }

    private RfvResponse toResponse(RfvScore score) {
        return new RfvResponse(score.getRecency(), score.getFrequency(), score.getValue(),
                score.getCode(), score.getSegment(), score.getCalculatedAt());
    }
}
