package com.tcc.privacidade.service;

import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.openrouter.OpenRouterClient;
import org.springframework.stereotype.Service;

@Service
public class PolicyAnalysisService {

    private final OpenRouterClient openRouterClient;

    public PolicyAnalysisService(OpenRouterClient openRouterClient) {
        this.openRouterClient = openRouterClient;
    }

    public PolicyAnalysisResponse analyze(PolicyAnalysisRequest request) {
        return openRouterClient.analyze(request);
    }
}
