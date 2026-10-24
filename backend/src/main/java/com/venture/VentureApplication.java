package com.venture;

import com.venture.config.VentureProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(VentureProperties.class)
public class VentureApplication {

    public static void main(String[] args) {
        SpringApplication.run(VentureApplication.class, args);
    }
}
