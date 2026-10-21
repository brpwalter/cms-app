package com.cms.dto;

import com.cms.model.Role;
import jakarta.validation.constraints.NotNull;

public record UserRoleRequest(@NotNull Role role) {
}
