package com.fitfusion.config;

import com.fitfusion.entity.User;
import com.fitfusion.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Seed admin user if not exists
        if (!userRepository.existsByEmail("admin@fitfusion.com")) {
            User admin = new User();
            admin.setName("Admin User");
            admin.setEmail("admin@fitfusion.com");
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setRole(User.Role.ADMIN);

            userRepository.save(admin);
            log.info("✅ Default admin user created: admin@fitfusion.com");
        } else {
            log.info("ℹ️  Admin user already exists");
        }
    }
}
