package org.example.product;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.example.product.config.CacheProperties;

@SpringBootApplication(scanBasePackages = {
    "org.example.product",
    "org.example.platform.logging",
    "org.example.platform.resilience",
    "org.example.platform.error"
})
@EnableConfigurationProperties(CacheProperties.class)
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
