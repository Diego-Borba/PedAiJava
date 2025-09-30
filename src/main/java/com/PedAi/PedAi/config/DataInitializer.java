package com.PedAi.PedAi.config;

import com.PedAi.PedAi.Model.Cliente;
import com.PedAi.PedAi.Model.UserRole;
import com.PedAi.PedAi.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private ClienteRepository clienteRepository;
    @Autowired
    private PasswordEncoder passwordEncoder;

    // Injeta a variável de ambiente. O valor padrão é 'false'.
    @Value("${FORCE_ADMIN_CREATION:false}")
    private boolean forceAdminCreation;

    @Override
    public void run(String... args) throws Exception {
        // A lógica agora roda se a variável for true OU se o usuário não existir.
        if (forceAdminCreation || clienteRepository.findByEmail("admin@pedai.com").isEmpty()) {
            
            // Usamos .orElseGet() para criar um novo se não existir, ou pegar o existente para atualizar.
            Cliente admin = clienteRepository.findByEmail("admin@pedai.com").orElseGet(Cliente::new);
            
            admin.setNome("Administrador");
            admin.setEmail("admin@pedai.com");
            admin.setSenha(passwordEncoder.encode("admin123")); // Garante que a senha sempre será a padrão
            admin.setTelefone("00000000000");
            admin.setRole(UserRole.ADMIN);
            
            clienteRepository.save(admin);
            
            if(forceAdminCreation) {
                System.out.println(">>> Variável de ambiente detectada. Usuário 'admin' foi forçadamente criado/atualizado. <<<");
            } else {
                System.out.println(">>> Usuário 'admin' padrão criado com senha 'admin123' <<<");
            }
        }
    }
}