package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.QuizResultResponse;
import com.tcc.privacidade.dto.QuizSubmitRequest;
import com.tcc.privacidade.entity.QuizResult;
import com.tcc.privacidade.repository.QuizResultRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class QuizService {

    private final QuizResultRepository quizResultRepository;

    public QuizService(QuizResultRepository quizResultRepository) {
        this.quizResultRepository = quizResultRepository;
    }

    public QuizResultResponse registrarResultado(UUID userId, QuizSubmitRequest request) {
        QuizResult resultado = new QuizResult(userId, request.score(), request.totalQuestions(), Instant.now());
        quizResultRepository.save(resultado);
        return new QuizResultResponse(resultado.getScore(), resultado.getTotalQuestions(), resultado.getCompletedAt());
    }

    public List<QuizResultResponse> historico(UUID userId) {
        return quizResultRepository.findByUserIdOrderByCompletedAtDesc(userId).stream()
                .map(r -> new QuizResultResponse(r.getScore(), r.getTotalQuestions(), r.getCompletedAt()))
                .toList();
    }

    public boolean concluiuAlgumaVez(UUID userId) {
        return quizResultRepository.existsByUserId(userId);
    }

    public void apagarTudo(UUID userId) {
        quizResultRepository.deleteByUserId(userId);
    }
}
