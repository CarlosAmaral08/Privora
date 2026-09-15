package com.tcc.privacidade.openrouter;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.exception.PolicyAnalysisProviderException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Set;

import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.INVALID_RESPONSE;

@Component
public class PolicyAnalysisResponseParser {

    private final ObjectMapper objectMapper;
    private final Validator validator;

    public PolicyAnalysisResponseParser(ObjectMapper objectMapper, Validator validator) {
        this.objectMapper = objectMapper;
        this.validator = validator;
    }

    public PolicyAnalysisResponse parse(String content) {
        if (content == null || content.isBlank()) throw invalidResponse(null);

        try {
            JsonNode root = objectMapper.readTree(content);
            ensureRequiredNullableIndicators(root);

            PolicyAnalysisResponse response = objectMapper.readerFor(PolicyAnalysisResponse.class)
                    .with(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                    .readValue(root);
            Set<ConstraintViolation<PolicyAnalysisResponse>> violations = validator.validate(response);
            if (!violations.isEmpty()) throw invalidResponse(null);
            return response;
        } catch (IOException | IllegalArgumentException exception) {
            throw invalidResponse(exception);
        }
    }

    private void ensureRequiredNullableIndicators(JsonNode root) {
        if (root == null || !root.isObject()) throw invalidResponse(null);
        JsonNode crm = root.get("crmAndProfiling");
        if (crm == null || !crm.isObject() ||
                !crm.has("usesPersonalization") || !crm.has("usesMarketing") || !crm.has("usesProfiling")) {
            throw invalidResponse(null);
        }
    }

    private PolicyAnalysisProviderException invalidResponse(Throwable cause) {
        String message = "O provedor de IA retornou uma resposta invalida.";
        return cause == null
                ? new PolicyAnalysisProviderException(INVALID_RESPONSE, message)
                : new PolicyAnalysisProviderException(INVALID_RESPONSE, message, cause);
    }
}
