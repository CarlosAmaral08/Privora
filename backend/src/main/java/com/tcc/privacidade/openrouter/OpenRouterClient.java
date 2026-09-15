package com.tcc.privacidade.openrouter;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcc.privacidade.config.OpenRouterProperties;
import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.exception.PolicyAnalysisProviderException;
import com.tcc.privacidade.service.PolicyAnalysisPromptFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.net.SocketTimeoutException;
import java.net.http.HttpTimeoutException;
import java.util.List;

import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.INVALID_RESPONSE;
import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.NOT_CONFIGURED;
import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.TIMEOUT;
import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.UNAVAILABLE;

@Component
public class OpenRouterClient {

    private static final String CHAT_COMPLETIONS_PATH = "/chat/completions";

    private final RestClient restClient;
    private final OpenRouterProperties properties;
    private final ObjectMapper objectMapper;
    private final PolicyAnalysisPromptFactory promptFactory;
    private final PolicyAnalysisResponseParser responseParser;

    public OpenRouterClient(
            RestClient openRouterRestClient,
            OpenRouterProperties properties,
            ObjectMapper objectMapper,
            PolicyAnalysisPromptFactory promptFactory,
            PolicyAnalysisResponseParser responseParser
    ) {
        this.restClient = openRouterRestClient;
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.promptFactory = promptFactory;
        this.responseParser = responseParser;
    }

    public PolicyAnalysisResponse analyze(PolicyAnalysisRequest request) {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new PolicyAnalysisProviderException(NOT_CONFIGURED,
                    "O servico de analise nao esta configurado.");
        }

        ChatCompletionRequest providerRequest = new ChatCompletionRequest(
                properties.model(),
                List.of(
                        new Message("system", promptFactory.systemPrompt()),
                        new Message("user", promptFactory.userPrompt(request))
                ),
                0.1,
                properties.maxOutputTokens(),
                new ResponseFormat("json_schema",
                        new JsonSchema("policy_analysis", true, promptFactory.responseSchema())),
                new ProviderPreferences(true)
        );

        try {
            String rawResponse = restClient.post()
                    .uri(CHAT_COMPLETIONS_PATH)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(providerRequest)
                    .retrieve()
                    .body(String.class);
            return responseParser.parse(extractContent(rawResponse));
        } catch (PolicyAnalysisProviderException exception) {
            throw exception;
        } catch (ResourceAccessException exception) {
            if (isTimeout(exception)) {
                throw new PolicyAnalysisProviderException(TIMEOUT,
                        "O provedor de IA excedeu o tempo limite.", exception);
            }
            throw new PolicyAnalysisProviderException(UNAVAILABLE,
                    "O provedor de IA esta indisponivel.", exception);
        } catch (RestClientResponseException exception) {
            throw new PolicyAnalysisProviderException(UNAVAILABLE,
                    "O provedor de IA recusou a solicitacao.", exception);
        } catch (RestClientException exception) {
            throw new PolicyAnalysisProviderException(UNAVAILABLE,
                    "Nao foi possivel contatar o provedor de IA.", exception);
        }
    }

    private String extractContent(String rawResponse) {
        if (rawResponse == null || rawResponse.isBlank()) throw invalidEnvelope(null);
        try {
            JsonNode root = objectMapper.readTree(rawResponse);
            JsonNode content = root.path("choices").path(0).path("message").path("content");
            if (!content.isTextual() || content.textValue().isBlank()) throw invalidEnvelope(null);
            return content.textValue();
        } catch (JsonProcessingException exception) {
            throw invalidEnvelope(exception);
        }
    }

    private PolicyAnalysisProviderException invalidEnvelope(Throwable cause) {
        String message = "O provedor de IA retornou uma resposta invalida.";
        return cause == null
                ? new PolicyAnalysisProviderException(INVALID_RESPONSE, message)
                : new PolicyAnalysisProviderException(INVALID_RESPONSE, message, cause);
    }

    private boolean isTimeout(Throwable error) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof SocketTimeoutException || current instanceof HttpTimeoutException) return true;
            current = current.getCause();
        }
        return false;
    }

    private record ChatCompletionRequest(
            String model,
            List<Message> messages,
            double temperature,
            @JsonProperty("max_tokens") int maxTokens,
            @JsonProperty("response_format") ResponseFormat responseFormat,
            ProviderPreferences provider
    ) {}

    private record Message(String role, String content) {}

    private record ResponseFormat(
            String type,
            @JsonProperty("json_schema") JsonSchema jsonSchema
    ) {}

    private record JsonSchema(String name, boolean strict, JsonNode schema) {}

    private record ProviderPreferences(@JsonProperty("require_parameters") boolean requireParameters) {}
}
