package com.tcc.privacidade.controller;

import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.exception.GlobalExceptionHandler;
import com.tcc.privacidade.exception.PolicyAnalysisProviderException;
import com.tcc.privacidade.service.PolicyAnalysisService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static com.tcc.privacidade.exception.PolicyAnalysisProviderException.Reason.TIMEOUT;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = PolicyAnalysisController.class,
        properties = "app.cors.allowed-origins=https://privora.zapeu.net,chrome-extension://abcdefghijklmnopabcdefghijklmnop"
)
@Import(GlobalExceptionHandler.class)
class PolicyAnalysisControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PolicyAnalysisService policyAnalysisService;

    @Test
    void permiteOrigemExataDaExtensaoConfigurada() throws Exception {
        mockMvc.perform(options("/api/policy-analyses")
                        .header("Origin", "chrome-extension://abcdefghijklmnopabcdefghijklmnop")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin",
                        "chrome-extension://abcdefghijklmnopabcdefghijklmnop"));
    }

    @Test
    void rejeitaOrigemDaExtensaoNaoConfigurada() throws Exception {
        mockMvc.perform(options("/api/policy-analyses")
                        .header("Origin", "chrome-extension://ponmlkjihgfedcbaponmlkjihgfedcba")
                        .header("Access-Control-Request-Method", "POST")
                        .header("Access-Control-Request-Headers", "content-type"))
                .andExpect(status().isForbidden())
                .andExpect(header().doesNotExist("Access-Control-Allow-Origin"));
    }

    @Test
    void rejeitaJsonMalformado() throws Exception {
        mockMvc.perform(post("/api/policy-analyses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Corpo da requisicao invalido."));

        verify(policyAnalysisService, never()).analyze(any());
    }

    @Test
    void rejeitaRequestSemText() throws Exception {
        mockMvc.perform(post("/api/policy-analyses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Dados invalidos."));

        verify(policyAnalysisService, never()).analyze(any());
    }

    @Test
    void rejeitaTextVazio() throws Exception {
        mockMvc.perform(post("/api/policy-analyses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"   \"}"))
                .andExpect(status().isBadRequest());

        verify(policyAnalysisService, never()).analyze(any());
    }

    @Test
    void rejeitaTextAcimaDoLimite() throws Exception {
        String body = "{\"text\":\"" + "a".repeat(PolicyAnalysisRequest.MAX_TEXT_LENGTH + 1) + "\"}";

        mockMvc.perform(post("/api/policy-analyses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());

        verify(policyAnalysisService, never()).analyze(any());
    }

    @Test
    void converteTimeoutDoProviderEmGatewayTimeoutSemDetalhesSensiveis() throws Exception {
        when(policyAnalysisService.analyze(any())).thenThrow(
                new PolicyAnalysisProviderException(TIMEOUT, "detalhe interno que nao deve vazar"));

        mockMvc.perform(post("/api/policy-analyses")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"text\":\"Politica com conteudo suficiente.\"}"))
                .andExpect(status().isGatewayTimeout())
                .andExpect(jsonPath("$.message").value("O provedor de analise excedeu o tempo limite."));
    }
}
