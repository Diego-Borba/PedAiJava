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

    @Value("${FORCE_ADMIN_CREATION:false}")
    private boolean forceAdminCreation;

    @Override
    public void run(String... args) throws Exception {
        // Cria/Atualiza usuário ADMIN
        if (forceAdminCreation || clienteRepository.findByEmail("admin@pedai.com").isEmpty()) {
            Cliente admin = clienteRepository.findByEmail("admin@pedai.com").orElse(new Cliente());
            admin.setNome("Administrador");
            admin.setEmail("admin@pedai.com");
            admin.setSenha(passwordEncoder.encode("admin123"));
            admin.setTelefone("00000000000");
            admin.setRole(UserRole.ADMIN);
            clienteRepository.save(admin);
        }

        // --- CORREÇÃO APLICADA AQUI ---
        // Cria cliente "Consumidor Final" se não existir pelo e-mail
        if (clienteRepository.findByEmail("consumidor@final.com").isEmpty()) {
            Cliente consumidorFinal = new Cliente();
            // NÃO definimos mais o ID manualmente. Deixamos o banco de dados gerar.
            consumidorFinal.setNome("Consumidor Final");
            consumidorFinal.setEmail("consumidor@final.com");
            consumidorFinal.setSenha(passwordEncoder.encode("consumidor")); // Senha genérica
            consumidorFinal.setTelefone("00000000000");
            consumidorFinal.setRole(UserRole.USER);
            clienteRepository.save(consumidorFinal);
            System.out.println(">>> Cliente 'Consumidor Final' criado com sucesso. <<<");
        }
    }
}