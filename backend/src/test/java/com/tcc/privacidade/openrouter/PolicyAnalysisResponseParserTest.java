package com.tcc.privacidade.openrouter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.exception.PolicyAnalysisProviderException;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.INVALID_RESPONSE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PolicyAnalysisResponseParserTest {

    private PolicyAnalysisResponseParser parser;

    @BeforeEach
    void setUp() {
        Validator validator = Validation.buildDefaultValidatorFactory().getValidator();
        parser = new PolicyAnalysisResponseParser(new ObjectMapper(), validator);
    }

    @Test
    void converteJsonEstruturadoValido() {
        PolicyAnalysisResponse response = parser.parse(validAnalysisJson());

        assertThat(response.summary()).isEqualTo("A politica descreve coleta para prestar o servico.");
        assertThat(response.dataCategories()).hasSize(1);
        assertThat(response.crmAndProfiling().usesProfiling()).isNull();
    }

    @Test
    void rejeitaJsonInvalido() {
        assertThatThrownBy(() -> parser.parse("```json\n{nao e json}\n```"))
                .isInstanceOfSatisfying(PolicyAnalysisProviderException.class,
                        exception -> assertThat(exception.getReason()).isEqualTo(INVALID_RESPONSE));
    }

    @Test
    void rejeitaRespostaSemIndicadorObrigatorioMesmoQuandoNuloEValido() {
        String missingIndicator = validAnalysisJson().replace("\"usesProfiling\": null,", "");

        assertThatThrownBy(() -> parser.parse(missingIndicator))
                .isInstanceOfSatisfying(PolicyAnalysisProviderException.class,
                        exception -> assertThat(exception.getReason()).isEqualTo(INVALID_RESPONSE));
    }

    static String validAnalysisJson() {
        return """
                {
                  "summary": "A politica descreve coleta para prestar o servico.",
                  "dataCategories": [
                    {"name": "Dados de cadastro", "evidence": "Informa coleta de nome e e-mail."}
                  ],
                  "purposes": [
                    {"name": "Prestacao do servico", "evidence": "Usa os dados para operar a conta."}
                  ],
                  "sharing": [],
                  "retention": {
                    "summary": "Nao informado no documento",
                    "evidence": "Nao informado no documento"
                  },
                  "userControls": [],
                  "rights": [],
                  "crmAndProfiling": {
                    "usesPersonalization": true,
                    "usesMarketing": false,
                    "usesProfiling": null,
                    "summary": "Personalizacao declarada; perfilamento nao informado.",
                    "evidence": "O documento menciona conteudo personalizado."
                  },
                  "caveats": ["Prazo de retencao nao informado."]
                }
                """;
    }
}
