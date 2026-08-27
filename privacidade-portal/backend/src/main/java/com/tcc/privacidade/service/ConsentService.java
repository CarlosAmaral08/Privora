package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.ConsentDto;
import com.tcc.privacidade.dto.ConsentUpdateRequest;
import com.tcc.privacidade.entity.Consent;
import com.tcc.privacidade.entity.ConsentCategory;
import com.tcc.privacidade.repository.ConsentRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ConsentService {

    private final ConsentRepository consentRepository;

    public ConsentService(ConsentRepository consentRepository) {
        this.consentRepository = consentRepository;
    }

    /** Roda uma unica vez, quando a sessao e criada. */
    public void inicializarConsentimentosPadrao(UUID userId) {
        Instant agora = Instant.now();
        consentRepository.save(new Consent(userId, ConsentCategory.NECESSARIOS, true, agora));
        consentRepository.save(new Consent(userId, ConsentCategory.PREFERENCIAS, false, agora));
        consentRepository.save(new Consent(userId, ConsentCategory.METRICAS_CAMPANHA, false, agora));
    }

    public List<ConsentDto> listar(UUID userId) {
        return consentRepository.findByUserId(userId).stream()
                .map(c -> new ConsentDto(c.getCategory(), c.isGranted(), c.getUpdatedAt()))
                .toList();
    }

    public List<ConsentDto> atualizar(UUID userId, ConsentUpdateRequest request) {
        for (ConsentUpdateRequest.ConsentItem item : request.consents()) {
            // categoria NECESSARIOS nunca pode ser desligada
            if (item.category() == ConsentCategory.NECESSARIOS) {
                continue;
            }
            Consent consent = consentRepository.findByUserIdAndCategory(userId, item.category())
                    .orElseGet(() -> new Consent(userId, item.category(), false, Instant.now()));
            consent.setGranted(item.granted());
            consent.setUpdatedAt(Instant.now());
            consentRepository.save(consent);
        }
        return listar(userId);
    }

    public boolean isGranted(UUID userId, ConsentCategory category) {
        return consentRepository.findByUserIdAndCategory(userId, category)
                .map(Consent::isGranted)
                .orElse(false);
    }

    public void apagarTudo(UUID userId) {
        consentRepository.deleteByUserId(userId);
    }
}
