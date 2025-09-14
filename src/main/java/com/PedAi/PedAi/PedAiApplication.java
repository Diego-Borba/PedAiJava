package com.PedAi.PedAi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.Map;

@SpringBootApplication
public class PedAiApplication {

    public static void main(String[] args) {
        // Mapa das variáveis de ambiente necessárias
        Map<String, String> envVars = Map.of(
            "PGHOST", System.getenv("PGHOST"),
            "PGPORT", System.getenv("PGPORT"),
            "PGDATABASE", System.getenv("PGDATABASE"),
            "PGUSER", System.getenv("PGUSER"),
            "PGPASSWORD", System.getenv("PGPASSWORD")
        );

        // Verifica se alguma variável é nula ou vazia
        for (Map.Entry<String, String> entry : envVars.entrySet()) {
            if (entry.getValue() == null || entry.getValue().isBlank()) {
                System.err.println("Erro Crítico: A variável de ambiente obrigatória '" + entry.getKey() + "' não foi encontrada.");
                System.err.println("O deploy irá falhar. Verifique a conexão entre os serviços no Railway.");
                System.exit(1); // Encerra a aplicação com código de erro
            }
        }

        // Se todas as variáveis existem, constrói a URL e define as propriedades
        String dbUrl = String.format("jdbc:postgresql://%s:%s/%s",
            envVars.get("PGHOST"),
            envVars.get("PGPORT"),
            envVars.get("PGDATABASE")
        );
        
        System.setProperty("spring.datasource.url", dbUrl);
        System.setProperty("spring.datasource.username", envVars.get("PGUSER"));
        System.setProperty("spring.datasource.password", envVars.get("PGPASSWORD"));

        // Inicia a aplicação Spring
        SpringApplication.run(PedAiApplication.class, args);
    }
}