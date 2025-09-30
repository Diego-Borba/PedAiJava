// src/main/java/com/PedAi/PedAi/Controller/AuthController.java
package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.LoginRequestDTO;
import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.UserRole;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private TokenService tokenService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        Cliente cliente = clienteRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (cliente == null || cliente.getRole() != UserRole.ADMIN || !passwordEncoder.matches(loginRequest.getSenha(), cliente.getSenha())) {
            return ResponseEntity.status(401).body("Credenciais inválidas ou sem permissão de acesso.");
        }
        
        String token = tokenService.generateToken(cliente);
        return ResponseEntity.ok(Map.of("token", token));
    }
}