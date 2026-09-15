package com.tcc.privacidade.controller;

import com.tcc.privacidade.dto.PolicyAnalysisRequest;
import com.tcc.privacidade.dto.PolicyAnalysisResponse;
import com.tcc.privacidade.service.PolicyAnalysisService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/policy-analyses")
public class PolicyAnalysisController {

    private final PolicyAnalysisService policyAnalysisService;

    public PolicyAnalysisController(PolicyAnalysisService policyAnalysisService) {
        this.policyAnalysisService = policyAnalysisService;
    }

    @PostMapping
    public PolicyAnalysisResponse analyze(@Valid @RequestBody PolicyAnalysisRequest request) {
        return policyAnalysisService.analyze(request);
    }
}
