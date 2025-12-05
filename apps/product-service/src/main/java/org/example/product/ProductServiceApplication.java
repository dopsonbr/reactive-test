package org.example.product;

import org.example.product.config.CacheProperties;
import org.example.product.config.SearchCacheProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(
        scanBasePackages = {
            "org.example.product",
            "org.example.platform.logging",
            "org.example.platform.resilience",
            "org.example.platform.error",
            "org.example.platform.security"
        })
@EnableConfigurationProperties({CacheProperties.class, SearchCacheProperties.class})
public class ProductServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(ProductServiceApplication.class, args);
    }
}
