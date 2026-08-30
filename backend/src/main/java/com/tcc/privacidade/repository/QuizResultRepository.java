package com.tcc.privacidade.repository;

import com.tcc.privacidade.entity.QuizResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface QuizResultRepository extends JpaRepository<QuizResult, UUID> {

    List<QuizResult> findByUserIdOrderByCompletedAtDesc(UUID userId);

    boolean existsByUserId(UUID userId);

    void deleteByUserId(UUID userId);
}
