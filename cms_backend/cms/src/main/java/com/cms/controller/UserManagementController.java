package com.cms.controller;

import com.cms.dto.ManagedUserResponse;
import com.cms.dto.UserCreateRequest;
import com.cms.dto.UserRoleRequest;
import com.cms.dto.UserUpdateRequest;
import com.cms.model.Role;
import com.cms.model.User;
import com.cms.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5000"})
public class UserManagementController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserManagementController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<ManagedUserResponse> getUsers() {
        return userRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ManagedUserResponse createUser(@Valid @RequestBody UserCreateRequest request) {
        String username = request.username().trim();
        String email = request.email().trim();
        if (userRepository.findByUsername(username).isPresent() || userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Benutzername oder E-Mail-Adresse ist bereits vergeben.");
        }

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRoles(Set.of(request.role()));
        return toResponse(userRepository.save(user));
    }

    @PutMapping("/{id}/role")
    public ManagedUserResponse updateRole(@PathVariable Long id,
                                          @Valid @RequestBody UserRoleRequest request,
                                          Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Benutzer nicht gefunden."));

        ensureRoleChangeAllowed(user, request.role(), authentication);
        user.setRoles(Set.of(request.role()));
        return toResponse(userRepository.save(user));
    }

    @PutMapping("/{id}")
    public ManagedUserResponse updateUser(@PathVariable Long id,
                                          @Valid @RequestBody UserUpdateRequest request,
                                          Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Benutzer nicht gefunden."));
        String username = request.username().trim();
        String email = request.email().trim();

        if (user.getUsername().equals(authentication.getName()) && !user.getUsername().equals(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Der eigene Benutzername kann während der Anmeldung nicht geändert werden.");
        }
        userRepository.findByUsername(username)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Der Benutzername ist bereits vergeben.");
                });
        if (userRepository.existsByEmailAndIdNot(email, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Die E-Mail-Adresse ist bereits vergeben.");
        }

        ensureRoleChangeAllowed(user, request.role(), authentication);
        user.setUsername(username);
        user.setEmail(email);
        user.setRoles(Set.of(request.role()));
        return toResponse(userRepository.save(user));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteUser(@PathVariable Long id, Authentication authentication) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Benutzer nicht gefunden."));

        if (user.getUsername().equals(authentication.getName())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Das eigene Benutzerkonto kann nicht gelöscht werden.");
        }
        if (user.getRoles().contains(Role.ROLE_ADMIN) && countAdmins() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Der letzte Admin kann nicht gelöscht werden.");
        }
        userRepository.delete(user);
    }

    private void ensureRoleChangeAllowed(User user, Role requestedRole, Authentication authentication) {
        if (user.getUsername().equals(authentication.getName()) && requestedRole != Role.ROLE_ADMIN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Die eigene Admin-Rolle kann nicht entfernt werden.");
        }
        if (user.getRoles().contains(Role.ROLE_ADMIN)
                && requestedRole != Role.ROLE_ADMIN
                && countAdmins() <= 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Der letzte Admin kann nicht herabgestuft werden.");
        }
    }

    private long countAdmins() {
        return userRepository.findAll().stream()
                .filter(existing -> existing.getRoles().contains(Role.ROLE_ADMIN))
                .count();
    }

    private ManagedUserResponse toResponse(User user) {
        Role role = user.getRoles().iterator().next();
        return new ManagedUserResponse(user.getId(), user.getUsername(), user.getEmail(), role.name());
    }
}
