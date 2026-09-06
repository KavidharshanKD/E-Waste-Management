# Build Stage
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy Maven wrapper & pom.xml first for dependency caching
COPY pom.xml .
COPY .mvn .mvn
COPY mvnw .
RUN chmod +x mvnw && ./mvnw dependency:go-offline -B

# Copy source code and package application
COPY src src
RUN ./mvnw package -DskipTests

# Production Stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy compiled JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Create directory for e-waste upload files
RUN mkdir -p uploads/ewaste

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
