# Use uma imagem base oficial do Java 17, pois seu projeto usa Java 17
FROM eclipse-temurin:17-jdk-jammy

# Define o diretório de trabalho dentro do container
WORKDIR /app

# Copie o arquivo JAR compilado da sua aplicação para o container
# O nome do JAR pode variar. Verifique o nome gerado na pasta 'target' após compilar.
# Geralmente é algo como PedAi-0.0.1-SNAPSHOT.jar
COPY target/PedAi-0.0.1-SNAPSHOT.jar app.jar

# Expõe a porta em que sua aplicação Spring Boot roda (padrão 8080)
EXPOSE 8080

# Comando para executar a aplicação quando o container iniciar
ENTRYPOINT ["java", "-jar", "app.jar"]