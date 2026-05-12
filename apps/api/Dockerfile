FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x gradlew

RUN ./gradlew build -x test

EXPOSE 10000

CMD ["java", "-jar", "build/libs/api-0.0.1-SNAPSHOT.jar"]