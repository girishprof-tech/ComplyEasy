package com.venture.config;

import com.venture.security.AuthInterceptor;
import com.venture.security.CurrentUserArgumentResolver;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.resource.PathResourceResolver;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AuthInterceptor authInterceptor;
    private final CurrentUserArgumentResolver currentUserResolver;
    private final VentureProperties props;

    public WebConfig(
            AuthInterceptor authInterceptor, CurrentUserArgumentResolver currentUserResolver, VentureProperties props) {
        this.authInterceptor = authInterceptor;
        this.currentUserResolver = currentUserResolver;
        this.props = props;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(authInterceptor).addPathPatterns("/api/**");
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserResolver);
    }

    /**
     * Serves the built React app (if present) with a single-page-app
     * fallback: any non-API path that is not a real file returns index.html
     * so the client-side router can handle it.
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path dist = Path.of(props.web().distDir()).toAbsolutePath().normalize();
        if (!Files.isDirectory(dist)) return;

        registry.addResourceHandler("/**")
                .addResourceLocations(dist.toUri().toString())
                .resourceChain(false)
                .addResolver(new PathResourceResolver() {
                    @Override
                    protected Resource getResource(String resourcePath, Resource location) throws IOException {
                        if (resourcePath.startsWith("api/")) return null;
                        Resource requested = location.createRelative(resourcePath);
                        if (requested.exists() && requested.isReadable() && !resourcePath.isEmpty()) {
                            return requested;
                        }
                        return new FileSystemResource(dist.resolve("index.html"));
                    }
                });
    }
}
