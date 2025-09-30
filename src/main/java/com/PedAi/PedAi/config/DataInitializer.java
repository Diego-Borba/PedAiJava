// src/main/java/com/PedAi/PedAi/config/DataInitializer.java
package com.PedAi.PedAi.config;

import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.UserRole;
import com.PedAi.PedAi.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (clienteRepository.findByEmail("admin@pedai.com").isEmpty()) {
            Cliente admin = new Cliente();
            admin.setNome("Administrador");
            admin.setEmail("admin@pedai.com");
            admin.setSenha(passwordEncoder.encode("admin123")); // Senha padrão
            admin.setTelefone("00000000000");
            admin.setRole(UserRole.ADMIN);
            clienteRepository.save(admin);
            System.out.println(">>> Usuário 'admin' padrão criado com senha 'admin123' <<<");
        }
    }
}