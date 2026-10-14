package com.localhobbies.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ApiApplicationDatabaseUrlTests {

    @Test
    void convertsRenderPostgresUrlToJdbcProperties() {
        ApiApplication.NormalizedDatabaseUrl result = ApiApplication.normalizeDatabaseUrl(
                "postgresql://render_user:p%40ssword@db.internal:5432/local_hobbies?sslmode=require");

        assertThat(result.jdbcUrl())
                .isEqualTo("jdbc:postgresql://db.internal:5432/local_hobbies?sslmode=require");
        assertThat(result.username()).isEqualTo("render_user");
        assertThat(result.password()).isEqualTo("p@ssword");
    }

    @Test
    void preservesAnExistingJdbcUrl() {
        String jdbcUrl = "jdbc:postgresql://db.internal:5432/local_hobbies";

        ApiApplication.NormalizedDatabaseUrl result = ApiApplication.normalizeDatabaseUrl(jdbcUrl);

        assertThat(result.jdbcUrl()).isEqualTo(jdbcUrl);
        assertThat(result.username()).isNull();
        assertThat(result.password()).isNull();
    }
}
