package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.DashboardResponse;
import com.tcc.privacidade.repository.EventRepository;
import com.tcc.privacidade.repository.QuizResultRepository;
import com.tcc.privacidade.repository.RfvScoreRepository;
import com.tcc.privacidade.repository.UserSessionRepository;
import com.tcc.privacidade.rfv.RfvSegment;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Gera os numeros agregados para a pagina /dashboard (apresentacao academica).
 * Nenhum dado individual identificavel sai daqui, so contagens e taxas.
 */
@Service
public class DashboardService {

    private final UserSessionRepository sessionRepository;
    private final QuizResultRepository quizResultRepository;
    private final EventRepository eventRepository;
    private final RfvScoreRepository rfvScoreRepository;

    public DashboardService(UserSessionRepository sessionRepository, QuizResultRepository quizResultRepository,
                             EventRepository eventRepository, RfvScoreRepository rfvScoreRepository) {
        this.sessionRepository = sessionRepository;
        this.quizResultRepository = quizResultRepository;
        this.eventRepository = eventRepository;
        this.rfvScoreRepository = rfvScoreRepository;
    }

    public DashboardResponse gerar() {
        long totalUsers = sessionRepository.count();
        long totalEvents = eventRepository.count();

        long quizConcluidos = quizResultRepository.count();
        double quizCompletionRate = totalUsers == 0 ? 0.0 : round((double) quizConcluidos / totalUsers);

        // "acao de privacidade" = usuario tem pelo menos 1 registro de RFV com Valor >= 4
        // (abriu configuracoes ou fez acao pratica). Simplificacao razoavel para o protótipo.
        long usuariosComAcaoPrivacidade = rfvScoreRepository.findAll().stream()
                .filter(s -> s.getValue() >= 4)
                .count();
        double privacyActionRate = totalUsers == 0 ? 0.0 : round((double) usuariosComAcaoPrivacidade / totalUsers);

        Map<String, Long> distribuicao = new LinkedHashMap<>();
        Map<RfvSegment, Long> contagem = new EnumMap<>(RfvSegment.class);
        for (RfvSegment segmento : RfvSegment.values()) {
            contagem.put(segmento, 0L);
        }
        rfvScoreRepository.findAll().forEach(s -> contagem.merge(s.getSegment(), 1L, Long::sum));
        contagem.forEach((segmento, qtd) -> distribuicao.put(segmento.name(), qtd));

        return new DashboardResponse(totalUsers, quizCompletionRate, privacyActionRate, totalEvents, distribuicao);
    }

    private double round(double valor) {
        return Math.round(valor * 100.0) / 100.0;
    }
}
