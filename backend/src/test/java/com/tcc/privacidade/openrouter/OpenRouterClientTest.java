package com.tcc.privacidade.openrouter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.tcc.privacidade.config.OpenRouterProperties;
import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.exception.PolicyAnalysisProviderException;
import com.tcc.privacidade.service.PolicyAnalysisPromptFactory;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.net.SocketTimeoutException;
import java.net.URI;
import java.time.Duration;

import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.INVALID_RESPONSE;
import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.TIMEOUT;
import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.UNAVAILABLE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.jsonPath;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class OpenRouterClientTest {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
    private final OpenRouterProperties properties = new OpenRouterProperties(
            "test-key",
            "openai/gpt-4o-mini",
            URI.create("https://openrouter.test/api/v1"),
            Duration.ofSeconds(2),
            2_500
    );

    @Test
    void enviaSchemaEstritoEConverteRespostaValida() throws Exception {
        RestClient.Builder builder = RestClient.builder().baseUrl(properties.baseUrl().toString());
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenRouterClient client = client(builder.build(), properties);

        server.expect(once(), requestTo("https://openrouter.test/api/v1/chat/completions"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header("Authorization", "Bearer test-key"))
                .andExpect(jsonPath("$.model").value("openai/gpt-4o-mini"))
                .andExpect(jsonPath("$.response_format.type").value("json_schema"))
                .andExpect(jsonPath("$.response_format.json_schema.strict").value(true))
                .andExpect(jsonPath("$.provider.require_parameters").value(true))
                .andRespond(withSuccess(providerEnvelope(PolicyAnalysisResponseParserTest.validAnalysisJson()),
                        MediaType.APPLICATION_JSON));

        PolicyAnalysisResponse response = client.analyze(request());

        assertThat(response.summary()).contains("coleta");
        server.verify();
    }

    @Test
    void rejeitaConteudoInvalidoDoOpenRouter() throws Exception {
        RestClient.Builder builder = RestClient.builder().baseUrl(properties.baseUrl().toString());
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenRouterClient client = client(builder.build(), properties);
        server.expect(requestTo("https://openrouter.test/api/v1/chat/completions"))
                .andRespond(withSuccess(providerEnvelope("nao e json"), MediaType.APPLICATION_JSON));

        assertThatThrownBy(() -> client.analyze(request()))
                .isInstanceOfSatisfying(PolicyAnalysisProviderException.class,
                        exception -> assertThat(exception.getReason()).isEqualTo(INVALID_RESPONSE));
        server.verify();
    }

    @Test
    void converteErroHttpDoProviderSemRepassarResposta() {
        RestClient.Builder builder = RestClient.builder().baseUrl(properties.baseUrl().toString());
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        OpenRouterClient client = client(builder.build(), properties);
        server.expect(requestTo("https://openrouter.test/api/v1/chat/completions"))
                .andRespond(withStatus(HttpStatus.BAD_GATEWAY)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body("{\"error\":{\"message\":\"detalhe sensivel\"}}"));

        assertThatThrownBy(() -> client.analyze(request()))
                .isInstanceOfSatisfying(PolicyAnalysisProviderException.class, exception -> {
                    assertThat(exception.getReason()).isEqualTo(UNAVAILABLE);
                    assertThat(exception.getMessage()).doesNotContain("detalhe sensivel");
                });
        server.verify();
    }

    @Test
    void converteTimeoutDoProvider() {
        RestClient timeoutClient = RestClient.builder()
                .baseUrl(properties.baseUrl().toString())
                .requestFactory((uri, httpMethod) -> {
                    throw new SocketTimeoutException("simulated timeout");
                })
                .build();
        OpenRouterClient client = client(timeoutClient, properties);

        assertThatThrownBy(() -> client.analyze(request()))
                .isInstanceOfSatisfying(PolicyAnalysisProviderException.class,
                        exception -> assertThat(exception.getReason()).isEqualTo(TIMEOUT));
    }

    private OpenRouterClient client(RestClient restClient, OpenRouterProperties selectedProperties) {
        PolicyAnalysisPromptFactory promptFactory = new PolicyAnalysisPromptFactory(objectMapper);
        PolicyAnalysisResponseParser parser = new PolicyAnalysisResponseParser(objectMapper, validator);
        return new OpenRouterClient(restClient, selectedProperties, objectMapper, promptFactory, parser);
    }

    private PolicyAnalysisRequest request() {
        return new PolicyAnalysisRequest(
                "https://example.com/privacy",
                "Politica de Privacidade",
                "Coletamos nome e e-mail para prestar o servico."
        );
    }

    private String providerEnvelope(String content) throws Exception {
        ObjectNode root = objectMapper.createObjectNode();
        ObjectNode message = root.putArray("choices").addObject().putObject("message");
        message.put("role", "assistant");
        message.put("content", content);
        return objectMapper.writeValueAsString(root);
    }
}
