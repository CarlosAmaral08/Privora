package com.tcc.privacidade.config;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Le e escreve o cookie de sessao anonima.
 * HttpOnly = o Javascript do navegador nao consegue ler esse cookie (mais seguro).
 */
@Component
public class SessionCookieUtil {

    public UUID lerUserId(HttpServletRequest request) {
        if (request.getCookies() == null) {
            return null;
        }
        for (Cookie cookie : request.getCookies()) {
            if (CookieNames.SESSION_COOKIE.equals(cookie.getName())) {
                try {
                    return UUID.fromString(cookie.getValue());
                } catch (IllegalArgumentException ex) {
                    return null; // cookie invalido/adulterado - trata como se nao existisse
                }
            }
        }
        return null;
    }

    public void escreverCookie(HttpServletResponse response, UUID userId) {
        Cookie cookie = new Cookie(CookieNames.SESSION_COOKIE, userId.toString());
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(60 * 60 * 24 * 365); // 1 ano
        // cookie.setSecure(true); // habilitar quando o site estiver em HTTPS (producao)
        response.addCookie(cookie);
    }

    public void apagarCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(CookieNames.SESSION_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
