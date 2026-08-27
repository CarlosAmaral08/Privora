package com.tcc.privacidade.service;

import com.tcc.privacidade.entity.ConsentCategory;
import com.tcc.privacidade.entity.UserSession;
import com.tcc.privacidade.repository.UserSessionRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Cuida do ciclo de vida da sessao anonima: cria na primeira visita,
 * reconhece nas visitas seguintes e atualiza "ultima vez visto".
 */
@Service
public class SessionService {

    private final UserSessionRepository sessionRepository;
    private final ConsentService consentService;

    public SessionService(UserSessionRepository sessionRepository, ConsentService consentService) {
        this.sessionRepository = sessionRepository;
        this.consentService = consentService;
    }

    /**
     * Se cookieUserId vier nulo ou nao existir mais no banco, cria uma sessao nova.
     * Caso contrario, so atualiza lastSeenAt e devolve a existente.
     */
    public UserSession resolveSession(UUID cookieUserId) {
        if (cookieUserId != null) {
            Optional<UserSession> existente = sessionRepository.findById(cookieUserId);
            if (existente.isPresent()) {
                UserSession sessao = existente.get();
                sessao.setLastSeenAt(Instant.now());
                return sessionRepository.save(sessao);
            }
        }
        return criarNovaSessao();
    }

    private UserSession criarNovaSessao() {
        Instant agora = Instant.now();
        UserSession nova = new UserSession(UUID.randomUUID(), agora, agora);
        sessionRepository.save(nova);
        // consentimento "NECESSARIOS" sempre comeca aceito, os outros comecam recusados
        consentService.inicializarConsentimentosPadrao(nova.getId());
        return nova;
    }

    public UserSession getOrThrow(UUID userId) {
        return sessionRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("Sessao nao encontrada: " + userId));
    }

    public void deleteSession(UUID userId) {
        sessionRepository.deleteById(userId);
    }
}
