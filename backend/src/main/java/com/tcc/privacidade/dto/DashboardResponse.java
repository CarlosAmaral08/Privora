package com.tcc.privacidade.dto;

import java.util.Map;

public record DashboardResponse(
        long totalUsers,
        double quizCompletionRate,
        double privacyActionRate,
        long totalEvents,
        Map<String, Long> segmentDistribution
) {}
