package com.tcc.privacidade.dto;

import com.tcc.privacidade.entity.ConsentCategory;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record ConsentUpdateRequest(@NotNull List<ConsentItem> consents) {

    public record ConsentItem(@NotNull ConsentCategory category, boolean granted) {}
}
