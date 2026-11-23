# Render で Spring Boot を動かすためのイメージ。
# 1段目でビルドし、2段目には実行に必要な jar だけを入れて、イメージを小さくする。
FROM gradle:8.14.3-jdk21 AS build
WORKDIR /app
COPY build.gradle settings.gradle gradle.properties ./
COPY src ./src
RUN gradle bootJar --no-daemon

FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar
# Render の無料プランはメモリが少ないため、Java が使うメモリの上限を割合で決める
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75"
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
