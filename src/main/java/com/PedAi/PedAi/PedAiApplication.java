package com.PedAi.PedAi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class PedAiApplication {

    public static void main(String[] args) {
        // Lógica para ler as variáveis de ambiente do Railway
        String dbUrl = String.format(
                "jdbc:postgresql://%s:%s/%s",
                System.getenv("PGHOST"),
                System.getenv("PGPORT"),
                System.getenv("PGDATABASE")
        );
        String dbUser = System.getenv("PGUSER");
        String dbPassword = System.getenv("PGPASSWORD");

        // Define as propriedades para o Spring usar
        System.setProperty("spring.datasource.url", dbUrl);
        System.setProperty("spring.datasource.username", dbUser);
        System.setProperty("spring.datasource.password", dbPassword);

        // Inicia a aplicação Spring
        SpringApplication.run(PedAiApplication.class, args);
    }
}