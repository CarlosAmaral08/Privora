package com.tcc.privacidade.controller;

import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.exception.PolicyAnalysisRateLimitException;
import com.tcc.privacidade.ratelimit.PolicyAnalysisClientIpResolver;
import com.tcc.privacidade.ratelimit.PolicyAnalysisConcurrencyLimiter;
import com.tcc.privacidade.ratelimit.PolicyAnalysisRateLimiter;
import com.tcc.privacidade.service.PolicyAnalysisService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/policy-analyses")
public class PolicyAnalysisController {

    private final PolicyAnalysisService policyAnalysisService;
    private final PolicyAnalysisClientIpResolver clientIpResolver;
    private final PolicyAnalysisRateLimiter rateLimiter;
    private final PolicyAnalysisConcurrencyLimiter concurrencyLimiter;

    public PolicyAnalysisController(
            PolicyAnalysisService policyAnalysisService,
            PolicyAnalysisClientIpResolver clientIpResolver,
            PolicyAnalysisRateLimiter rateLimiter,
            PolicyAnalysisConcurrencyLimiter concurrencyLimiter
    ) {
        this.policyAnalysisService = policyAnalysisService;
        this.clientIpResolver = clientIpResolver;
        this.rateLimiter = rateLimiter;
        this.concurrencyLimiter = concurrencyLimiter;
    }

    @PostMapping
    public PolicyAnalysisResponse analyze(
            @Valid @RequestBody PolicyAnalysisRequest request,
            HttpServletRequest httpRequest
    ) {
        PolicyAnalysisRateLimiter.Decision decision = rateLimiter.tryConsume(clientIpResolver.resolve(httpRequest));
        if (!decision.allowed()) {
            throw new PolicyAnalysisRateLimitException(decision.scope(), decision.retryAfterSeconds());
        }
        try (PolicyAnalysisConcurrencyLimiter.Lease ignored = concurrencyLimiter.acquire()) {
            return policyAnalysisService.analyze(request);
        }
    }
}
