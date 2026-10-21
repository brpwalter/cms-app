package com.cms.repository;

import com.cms.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface PageRepository extends JpaRepository<Page, Long> {
    Optional<Page> findBySlug(String slug);
    Optional<Page> findBySlugAndPublishedTrue(String slug);
    boolean existsBySlug(String slug);
    List<Page> findByAuthorUsername(String authorUsername);
    List<Page> findByPublishedTrue();
}