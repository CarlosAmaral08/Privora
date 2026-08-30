package com.tcc.privacidade.repository;

import com.tcc.privacidade.entity.Event;
import com.tcc.privacidade.entity.EventType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface EventRepository extends JpaRepository<Event, UUID> {

    List<Event> findByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserId(UUID userId);

    long countByUserIdAndEventTypeInAndCreatedAtAfter(
            UUID userId, List<EventType> eventTypes, Instant after);

    // pega o evento relevante mais recente do usuario (usado no calculo de Recencia)
    Event findFirstByUserIdAndEventTypeInOrderByCreatedAtDesc(UUID userId, List<EventType> eventTypes);

    void deleteByUserId(UUID userId);
}
