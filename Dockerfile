# =======================================================
# ESTÁGIO 1: O "CONSTRUTOR" (Builder)
# Usa uma imagem com Maven e JDK para compilar o projeto
# =======================================================
FROM maven:3.9-eclipse-temurin-17 AS builder

# Define o diretório de trabalho dentro do contêiner
WORKDIR /app

# Copia os arquivos de configuração do Maven e o código-fonte
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
COPY src ./src

# Executa o comando de build do Maven para gerar o arquivo .jar
# O -DskipTests acelera o processo por não rodar os testes
RUN ./mvnw clean package -DskipTests


# =======================================================
# ESTÁGIO 2: A IMAGEM FINAL
# Usa uma imagem leve, apenas com o Java Runtime, para rodar a aplicação
# =======================================================
FROM eclipse-temurin:17-jre-jammy

WORKDIR /app

# Copia APENAS o arquivo .jar gerado no estágio anterior (builder)
COPY --from=builder /app/target/PedAi-0.0.1-SNAPSHOT.jar app.jar

# Expõe a porta em que sua aplicação Spring Boot roda
EXPOSE 8080

# Comando para executar a aplicação quando o contêiner iniciar
ENTRYPOINT ["java", "-jar", "app.jar"]