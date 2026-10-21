package com.cms.controller;

import com.cms.dto.LoginRequest;
import com.cms.dto.AuthResponse;
import com.cms.dto.RegistrationRequest;
import com.cms.model.Role;
import com.cms.model.User;
import com.cms.repository.UserRepository;
import com.cms.service.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/public/auth")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AuthController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            // 1. Zugangsdaten über Spring Security prüfen
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            // 2. Benutzerdetails laden
            UserDetails userDetails = (UserDetails) authentication.getPrincipal();

            // 3. JWT Token generieren
            String jwtToken = jwtService.generateToken(userDetails);

            // 4. Rollen des Benutzers extrahieren
            List<String> roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .toList();

            // 5. Erfolgantwort mit Token zurückgeben
            return ResponseEntity.ok(new AuthResponse(jwtToken, userDetails.getUsername(), roles));

        } catch (Exception e) {
            // Fehlgeschlagener Login (z.B. falsches Passwort)
            return ResponseEntity.status(401).body("Ungültiger Benutzername oder Passwort");
        }
    }

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationRequest request) {
        String username = request.getUsername().trim();
        String email = request.getEmail().trim();

        if (userRepository.findByUsername(username).isPresent() || userRepository.existsByEmail(email)) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Benutzername oder E-Mail-Adresse ist bereits vergeben.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRoles(Set.of(Role.ROLE_READER));
        userRepository.saveAndFlush(user);

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
