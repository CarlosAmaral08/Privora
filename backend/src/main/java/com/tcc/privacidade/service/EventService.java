package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.EventRequest;
import com.tcc.privacidade.entity.ConsentCategory;
import com.tcc.privacidade.entity.Event;
import com.tcc.privacidade.entity.EventType;
import com.tcc.privacidade.repository.EventRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final ConsentService consentService;

    public EventService(EventRepository eventRepository, ConsentService consentService) {
        this.eventRepository = eventRepository;
        this.consentService = consentService;
    }

    /**
     * So grava o evento se o usuario deu consentimento para METRICAS_CAMPANHA.
     * VIEW_CONTENT e considerado essencial ao funcionamento educativo do site
     * e sempre e registrado (categoria NECESSARIOS), o resto depende de metricas.
     */
    public void registrar(UUID userId, EventRequest request) {
        boolean essencial = request.eventType() == EventType.VIEW_CONTENT;
        boolean podeRegistrar = essencial || consentService.isGranted(userId, ConsentCategory.METRICAS_CAMPANHA);

        if (!podeRegistrar) {
            return;
        }

        Event evento = new Event(userId, request.eventType(), request.metadataJson(), Instant.now());
        eventRepository.save(evento);
    }

    public List<Event> listar(UUID userId) {
        return eventRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long contarTotal(UUID userId) {
        return eventRepository.countByUserId(userId);
    }

    public void apagarTudo(UUID userId) {
        eventRepository.deleteByUserId(userId);
    }
}
