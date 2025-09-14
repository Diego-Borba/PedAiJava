# =======================================================
# ESTÁGIO 1: Builder
# =======================================================
FROM maven:3.9-eclipse-temurin-17 AS builder
WORKDIR /app
COPY .mvn/ .mvn
COPY mvnw pom.xml ./
COPY src ./src
RUN chmod +x ./mvnw
RUN ./mvnw clean package -DskipTests

# =======================================================
# ESTÁGIO 2: Imagem Final
# =======================================================
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# **LINHA CORRIGIDA ABAIXO**
# Copia o .jar do estágio de build (com o nome correto)
COPY --from=builder /app/target/PedAi-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Comando padrão para executar a aplicação
ENTRYPOINT ["java", "-jar", "app.jar"]