package com.tcc.privacidade.repository;

import com.tcc.privacidade.entity.RfvScore;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RfvScoreRepository extends JpaRepository<RfvScore, UUID> {

    void deleteByUserId(UUID userId);
}
