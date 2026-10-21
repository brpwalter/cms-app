package com.cms.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Mappt die URL /uploads/** auf das physische Verzeichnis uploads/
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:uploads/");
    }
}
