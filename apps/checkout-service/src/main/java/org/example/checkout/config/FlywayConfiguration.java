package org.example.checkout.config;

import javax.sql.DataSource;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.flyway.autoconfigure.FlywayDataSource;
import org.springframework.boot.jdbc.autoconfigure.DataSourceProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Flyway configuration for R2DBC applications.
 *
 * <p>Spring Boot 4.0's DataSourceAutoConfiguration does not create a JDBC DataSource when R2DBC is
 * present (ConnectionFactory exists). This configuration manually creates a DataSource specifically
 * for Flyway migrations.
 */
@Configuration
public class FlywayConfiguration {

  @Bean
  @ConfigurationProperties("spring.datasource")
  public DataSourceProperties flywayDataSourceProperties() {
    return new DataSourceProperties();
  }

  @Bean
  @FlywayDataSource
  public DataSource flywayDataSource(DataSourceProperties flywayDataSourceProperties) {
    return flywayDataSourceProperties.initializeDataSourceBuilder().build();
  }
}
