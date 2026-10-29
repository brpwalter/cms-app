package com.cms.dto;

import java.time.Instant;

public record MediaAssetResponse(
        String name,
        String url,
        long size,
        Instant lastModified,
        String contentType
) {
}
