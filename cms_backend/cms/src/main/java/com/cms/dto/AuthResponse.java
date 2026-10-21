package com.cms.dto;

import java.util.List;

public class AuthResponse {
    private final String token;
    private final String username;
    private final List<String> roles;

    public AuthResponse(String token, String username, List<String> roles) {
        this.token = token;
        this.username = username;
        this.roles = roles;
    }

    public String getToken() {
        return token;
    }

    public String getUsername() {
        return username;
    }

    public List<String> getRoles() {
        return roles;
    }
}
