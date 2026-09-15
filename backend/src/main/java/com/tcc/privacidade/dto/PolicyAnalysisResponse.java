package com.tcc.privacidade.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PolicyAnalysisResponse(
        @NotBlank @Size(max = 2_000) String summary,
        @NotNull @Size(max = 25) List<@Valid DataCategory> dataCategories,
        @NotNull @Size(max = 25) List<@Valid Purpose> purposes,
        @NotNull @Size(max = 25) List<@Valid Sharing> sharing,
        @NotNull @Valid Retention retention,
        @NotNull @Size(max = 25) List<@Valid UserControl> userControls,
        @NotNull @Size(max = 25) List<@Valid RightItem> rights,
        @NotNull @Valid CrmAndProfiling crmAndProfiling,
        @NotNull @Size(max = 25) List<@NotBlank @Size(max = 500) String> caveats
) {
    public record DataCategory(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Size(max = 500) String evidence
    ) {}

    public record Purpose(
            @NotBlank @Size(max = 200) String name,
            @NotBlank @Size(max = 500) String evidence
    ) {}

    public record Sharing(
            @NotBlank @Size(max = 200) String recipient,
            @NotBlank @Size(max = 300) String purpose,
            @NotBlank @Size(max = 500) String evidence
    ) {}

    public record Retention(
            @NotBlank @Size(max = 1_000) String summary,
            @NotBlank @Size(max = 500) String evidence
    ) {}

    public record UserControl(
            @NotBlank @Size(max = 300) String action,
            @NotBlank @Size(max = 500) String evidence
    ) {}

    public record RightItem(
            @NotBlank @Size(max = 200) String right,
            @NotBlank @Size(max = 500) String evidence
    ) {}

    public record CrmAndProfiling(
            Boolean usesPersonalization,
            Boolean usesMarketing,
            Boolean usesProfiling,
            @NotBlank @Size(max = 1_000) String summary,
            @NotBlank @Size(max = 500) String evidence
    ) {}
}
