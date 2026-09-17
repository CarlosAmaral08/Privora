package com.tcc.privacidade.ratelimit;

import com.tcc.privacidade.config.PolicyAnalysisRateLimitProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Optional;
import java.util.regex.Pattern;

@Component
public class PolicyAnalysisClientIpResolver {

    private static final String CLOUDFLARE_IP_HEADER = "CF-Connecting-IP";
    private static final Pattern IPV6_CHARACTERS = Pattern.compile("[0-9a-fA-F:.]+");

    private final PolicyAnalysisRateLimitProperties properties;

    public PolicyAnalysisClientIpResolver(PolicyAnalysisRateLimitProperties properties) {
        this.properties = properties;
    }

    public String resolve(HttpServletRequest request) {
        if (properties.trustCloudflareIp()) {
            Optional<String> cloudflareIp = normalizeIp(request.getHeader(CLOUDFLARE_IP_HEADER));
            if (cloudflareIp.isPresent()) return cloudflareIp.get();
        }

        String remoteAddress = request.getRemoteAddr();
        return normalizeIp(remoteAddress).orElseGet(() ->
                remoteAddress == null || remoteAddress.isBlank() ? "unknown" : remoteAddress.trim());
    }

    private Optional<String> normalizeIp(String candidate) {
        if (candidate == null || candidate.isBlank()) return Optional.empty();
        String value = candidate.trim();
        if (value.length() > 45 || value.contains(",") || value.chars().anyMatch(Character::isWhitespace)) {
            return Optional.empty();
        }
        if (value.indexOf(':') >= 0) return normalizeIpv6(value);
        return normalizeIpv4(value);
    }

    private Optional<String> normalizeIpv4(String value) {
        String[] parts = value.split("\\.", -1);
        if (parts.length != 4) return Optional.empty();

        int[] octets = new int[4];
        for (int index = 0; index < parts.length; index++) {
            String part = parts[index];
            if (part.isEmpty() || part.length() > 3 || !part.chars().allMatch(Character::isDigit)) {
                return Optional.empty();
            }
            int octet;
            try {
                octet = Integer.parseInt(part);
            } catch (NumberFormatException exception) {
                return Optional.empty();
            }
            if (octet > 255) return Optional.empty();
            octets[index] = octet;
        }
        return Optional.of(String.join(".", Arrays.stream(octets).mapToObj(String::valueOf).toList()));
    }

    private Optional<String> normalizeIpv6(String value) {
        if (!IPV6_CHARACTERS.matcher(value).matches()) return Optional.empty();
        try {
            InetAddress address = InetAddress.getByName(value);
            if (address.getAddress().length != 16) return Optional.empty();
            return Optional.of(address.getHostAddress());
        } catch (UnknownHostException exception) {
            return Optional.empty();
        }
    }
}
