# =======================================================
# ESTÁGIO 1: O "CONSTRUTOR" (Builder)
# =======================================================
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
COPY src ./src
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# =======================================================
# ESTÁGIO 2: A IMAGEM FINAL
# =======================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# Copia o .jar do estágio de build
COPY --from=builder /app/target/PedAi-0.0.1-SNAPSHOT.jar app.jar

# Copia o nosso novo script de inicialização e o torna executável
COPY start.sh .
RUN chmod +x start.sh

EXPOSE 8080

# **ALTERAÇÃO CRÍTICA**: Usa o script para iniciar
CMD ["./start.sh"]