package com.tcc.privacidade.repository;

import com.tcc.privacidade.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

// JpaRepository ja da de graca metodos como save(), findById(), deleteById()...
// Nao precisamos escrever SQL nenhum aqui.
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
}
