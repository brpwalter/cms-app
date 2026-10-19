package com.example.cms.repository;

import com.example.cms.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PageRepository extends JpaRepository<Page, Long> {
    Optional<Page> findBySlug(String slug);
    boolean existsBySlug(String slug);
}