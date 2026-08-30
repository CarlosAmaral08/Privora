package com.tcc.privacidade;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Classe principal. E ela que "liga" toda a aplicacao Spring Boot.
 * Ao rodar isso, o Spring escaneia os pacotes abaixo de com.tcc.privacidade
 * e cria automaticamente os controllers, services e repositories.
 */
@SpringBootApplication
public class PrivacidadePortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PrivacidadePortalApplication.class, args);
    }
}
