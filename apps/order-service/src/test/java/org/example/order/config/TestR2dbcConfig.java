package org.example.order.config;

import io.r2dbc.spi.ConnectionFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;
import org.springframework.r2dbc.connection.init.ConnectionFactoryInitializer;
import org.springframework.r2dbc.connection.init.ResourceDatabasePopulator;

/**
 * Test configuration for reactive schema initialization.
 *
 * <p>Uses R2DBC's ConnectionFactoryInitializer to run SQL scripts reactively.
 */
@Configuration
public class TestR2dbcConfig {

  @Bean
  public ConnectionFactoryInitializer initializer(ConnectionFactory connectionFactory) {
    ConnectionFactoryInitializer initializer = new ConnectionFactoryInitializer();
    initializer.setConnectionFactory(connectionFactory);

    ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
    populator.addScript(new ClassPathResource("db/migration/V1__create_orders_table.sql"));
    initializer.setDatabasePopulator(populator);

    return initializer;
  }
}
