package com.cms.model;

import java.util.HashSet;
import java.util.Set;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 50)
    private String username;

    @Column(unique = true, nullable = false, length = 100)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    @Column(nullable = false, length = 20)
    private String role = "READER";

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public Set<Role> getRoles() {
        String roleName = role.startsWith("ROLE_") ? role : "ROLE_" + role;
        return Set.of(Role.valueOf(roleName));
    }

    public void setRoles(Set<Role> roles) {
        if (roles == null || roles.isEmpty()) {
            throw new IllegalArgumentException("Ein Benutzer muss mindestens eine Rolle besitzen.");
        }
        this.role = roles.iterator().next().name().replaceFirst("^ROLE_", "");
    }
}
