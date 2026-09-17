package com.tcc.privacidade.ratelimit;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

class PolicyAnalysisClientIpResolverTest {

    @Test
    void usaCloudflareConnectingIpValidoQuandoConfiancaEstaHabilitada() {
        MockHttpServletRequest request = request("10.0.0.8", "203.0.113.42");

        assertThat(resolver(true).resolve(request)).isEqualTo("203.0.113.42");
    }

    @Test
    void ignoraCloudflareConnectingIpQuandoConfiancaEstaDesabilitada() {
        MockHttpServletRequest request = request("10.0.0.8", "203.0.113.42");

        assertThat(resolver(false).resolve(request)).isEqualTo("10.0.0.8");
    }

    @Test
    void headerCloudflareInvalidoNaoQuebraEFazFallbackParaRemoteAddr() {
        MockHttpServletRequest request = request("10.0.0.8", "nao-e-um-ip, 203.0.113.42");

        assertThat(resolver(true).resolve(request)).isEqualTo("10.0.0.8");
    }

    @Test
    void naoConfiaEmXForwardedFor() {
        MockHttpServletRequest request = request("10.0.0.8", null);
        request.addHeader("X-Forwarded-For", "203.0.113.99");

        assertThat(resolver(true).resolve(request)).isEqualTo("10.0.0.8");
    }

    private MockHttpServletRequest request(String remoteAddress, String cloudflareAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        if (cloudflareAddress != null) request.addHeader("CF-Connecting-IP", cloudflareAddress);
        return request;
    }

    private PolicyAnalysisClientIpResolver resolver(boolean trustCloudflareIp) {
        PolicyAnalysisRateLimitProperties properties = new PolicyAnalysisRateLimitProperties(
                true,
                10,
                Duration.ofMinutes(10),
                30,
                Duration.ofDays(1),
                200,
                3,
                trustCloudflareIp
        );
        return new PolicyAnalysisClientIpResolver(properties);
    }
}
