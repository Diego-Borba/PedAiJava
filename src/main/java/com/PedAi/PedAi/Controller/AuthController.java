package com.PedAi.PedAi.Controller;

import com.PedAi.PedAi.DTO.LoginRequestDTO;
import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.UserRole;
import com.PedAi.PedAi.repository.ClienteRepository;
import com.PedAi.PedAi.security.TokenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
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

    @Value("${api.security.token.secret}")
    private String activeSecret;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequest) {
        Cliente cliente = clienteRepository.findByEmail(loginRequest.getEmail()).orElse(null);

        if (cliente == null || cliente.getRole() != UserRole.ADMIN || !passwordEncoder.matches(loginRequest.getSenha(), cliente.getSenha())) {
            return ResponseEntity.status(401).body("Credenciais inválidas ou sem permissão de acesso.");
        }
        
        String token = tokenService.generateToken(cliente);
        return ResponseEntity.ok(Map.of("token", token));
    }

    @GetMapping("/debug/secret")
    public ResponseEntity<?> getActiveSecretKey() {
        String partialSecret = "SECRET_NAO_CONFIGURADO";
        if (activeSecret != null && activeSecret.length() > 5) {
            partialSecret = activeSecret.substring(0, 5) + "...";
        }
        
        // CORREÇÃO: Trocado ':' por ',' para a sintaxe correta do Map.of()
        return ResponseEntity.ok(Map.of(
            "propriedade", "api.security.token.secret",
            "valorParcialUtilizado", partialSecret
        ));
    }
}