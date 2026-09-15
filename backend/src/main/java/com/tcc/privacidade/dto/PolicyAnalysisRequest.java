package com.tcc.privacidade.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PolicyAnalysisRequest(
        @Size(max = 2_048)
        @Pattern(regexp = "^https?://\\S+$", message = "sourceUrl deve usar HTTP ou HTTPS")
        String sourceUrl,

        @Size(max = 300)
        String title,

        @NotBlank(message = "text e obrigatorio")
        @Size(max = MAX_TEXT_LENGTH, message = "text excede o limite permitido")
        String text
) {
    public static final int MAX_TEXT_LENGTH = 40_000;
}
