package com.cms.dto;

import com.cms.model.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UserCreateRequest(
        @NotBlank @Size(max = 50) String username,
        @NotBlank @Email @Size(max = 100) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull Role role) {
}
