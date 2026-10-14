package com.localhobbies.api;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ApiApplication {

	public static void main(String[] args) {
		configureRenderDatabase();
		SpringApplication.run(ApiApplication.class, args);
	}

	private static void configureRenderDatabase() {
		String databaseUrl = System.getenv("DATABASE_URL");

		if (databaseUrl == null || databaseUrl.isBlank()) {
			return;
		}

		NormalizedDatabaseUrl normalized = normalizeDatabaseUrl(databaseUrl);
		System.setProperty("spring.datasource.url", normalized.jdbcUrl());

		if (System.getenv("DATABASE_USERNAME") == null && normalized.username() != null) {
			System.setProperty("spring.datasource.username", normalized.username());
		}

		if (System.getenv("DATABASE_PASSWORD") == null && normalized.password() != null) {
			System.setProperty("spring.datasource.password", normalized.password());
		}
	}

	static NormalizedDatabaseUrl normalizeDatabaseUrl(String databaseUrl) {
		if (databaseUrl.startsWith("jdbc:postgresql://")) {
			return new NormalizedDatabaseUrl(databaseUrl, null, null);
		}

		if (!databaseUrl.startsWith("postgres://") && !databaseUrl.startsWith("postgresql://")) {
			return new NormalizedDatabaseUrl(databaseUrl, null, null);
		}

		URI uri = URI.create(databaseUrl);
		String username = null;
		String password = null;
		String rawUserInfo = uri.getRawUserInfo();

		if (rawUserInfo != null) {
			String[] credentials = rawUserInfo.split(":", 2);
			username = decode(credentials[0]);
			password = credentials.length > 1 ? decode(credentials[1]) : "";
		}

		StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://")
				.append(uri.getHost());

		if (uri.getPort() >= 0) {
			jdbcUrl.append(':').append(uri.getPort());
		}

		jdbcUrl.append(uri.getRawPath());

		if (uri.getRawQuery() != null) {
			jdbcUrl.append('?').append(uri.getRawQuery());
		}

		return new NormalizedDatabaseUrl(jdbcUrl.toString(), username, password);
	}

	private static String decode(String value) {
		return URLDecoder.decode(value, StandardCharsets.UTF_8);
	}

	record NormalizedDatabaseUrl(String jdbcUrl, String username, String password) {
	}
}
