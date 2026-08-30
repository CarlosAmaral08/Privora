package com.tcc.privacidade.repository;

import com.tcc.privacidade.entity.Consent;
import com.tcc.privacidade.entity.ConsentCategory;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConsentRepository extends JpaRepository<Consent, UUID> {

    // Spring Data cria a query automaticamente so pelo nome do metodo
    List<Consent> findByUserId(UUID userId);

    Optional<Consent> findByUserIdAndCategory(UUID userId, ConsentCategory category);

    void deleteByUserId(UUID userId);
}
