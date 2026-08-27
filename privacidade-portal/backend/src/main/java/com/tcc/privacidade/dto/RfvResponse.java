package com.tcc.privacidade.dto;

import com.tcc.privacidade.rfv.RfvSegment;
import java.time.Instant;

public record RfvResponse(
        int recency,
        int frequency,
        int value,
        String code,
        RfvSegment segment,
        Instant calculatedAt
) {}
