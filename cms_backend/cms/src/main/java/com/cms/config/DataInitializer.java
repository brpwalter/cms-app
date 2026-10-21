package com.cms.config;

import com.cms.model.User;
import com.cms.model.Role;
import com.cms.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "Admin2026!";
    private static final String INVALID_SCHEMA_PASSWORD_HASH =
            "$2a$10$e0myZ4cOub7WJpM6mFPMIeW7Z1S7g3dD3oQ8V6WqYF0C9JgL2z72W";

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        var existingAdmin = userRepository.findByUsername(ADMIN_USERNAME);
        if (existingAdmin.isEmpty()) {
            User admin = new User();
            admin.setUsername(ADMIN_USERNAME);
            admin.setEmail("admin@example.com");
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            admin.setRoles(Set.of(Role.ROLE_ADMIN));
            userRepository.save(admin);
            System.out.println(">> [CMS] Initialer Admin-User wurde angelegt.");
        } else if (INVALID_SCHEMA_PASSWORD_HASH.equals(existingAdmin.get().getPassword())) {
            User admin = existingAdmin.get();
            admin.setPassword(passwordEncoder.encode(ADMIN_PASSWORD));
            userRepository.save(admin);
            System.out.println(">> [CMS] Fehlerhafter Initial-Admin-Passworthash wurde korrigiert.");
        }
    }
}
