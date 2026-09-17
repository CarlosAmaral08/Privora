package com.tcc.privacidade.controller;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.exception.PolicyAnalysisProviderException;
import com.tcc.privacidade.ratelimit.PolicyAnalysisClientIpResolver;
import com.tcc.privacidade.ratelimit.PolicyAnalysisConcurrencyLimiter;
import com.tcc.privacidade.ratelimit.PolicyAnalysisRateLimiter;
import com.tcc.privacidade.service.PolicyAnalysisService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Duration;

import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.TIMEOUT;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PolicyAnalysisControllerConcurrencyTest {

    @Mock
    private PolicyAnalysisService policyAnalysisService;

    @Mock
    private PolicyAnalysisClientIpResolver clientIpResolver;

    @Mock
    private PolicyAnalysisRateLimiter rateLimiter;

    private PolicyAnalysisController controller;

    @BeforeEach
    void setUp() {
        PolicyAnalysisRateLimitProperties properties = new PolicyAnalysisRateLimitProperties(
                true,
                10,
                Duration.ofMinutes(10),
                30,
                Duration.ofDays(1),
                200,
                1,
                false
        );
        controller = new PolicyAnalysisController(
                policyAnalysisService,
                clientIpResolver,
                rateLimiter,
                new PolicyAnalysisConcurrencyLimiter(properties)
        );
        when(clientIpResolver.resolve(any())).thenReturn("127.0.0.1");
        when(rateLimiter.tryConsume(anyString())).thenReturn(PolicyAnalysisRateLimiter.Decision.allow());
    }

    @Test
    void liberaVagaDepoisDeTimeoutDoProvider() {
        PolicyAnalysisRequest request = new PolicyAnalysisRequest(null, null, "Conteudo da politica");
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();
        PolicyAnalysisResponse successfulResponse = org.mockito.Mockito.mock(PolicyAnalysisResponse.class);
        when(policyAnalysisService.analyze(request))
                .thenThrow(new PolicyAnalysisProviderException(TIMEOUT, "timeout simulado"))
                .thenReturn(successfulResponse);

        assertThatThrownBy(() -> controller.analyze(request, httpRequest))
                .isInstanceOf(PolicyAnalysisProviderException.class);

        assertThat(controller.analyze(request, httpRequest)).isSameAs(successfulResponse);
    }
}
