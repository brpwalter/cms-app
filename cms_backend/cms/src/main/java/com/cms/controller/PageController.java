package com.cms.controller;

import com.cms.dto.PageReviewRequest;
import com.cms.entity.Page;
import com.cms.entity.PageCorrectionComment;
import com.cms.repository.PageRepository;
import com.cms.service.PageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:5000"})
public class PageController {

    @Autowired
    private PageService pageService;

    @Autowired
    private PageRepository pageRepository;

    @GetMapping("/pages")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE', 'READER')")
    public List<Page> getAllPages(Authentication authentication) {
        return pageService.getAllPages(authentication);
    }

    @GetMapping("/pages/preview/{slug}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE', 'READER')")
    public ResponseEntity<Page> previewPage(@PathVariable String slug, Authentication authentication) {
        return pageRepository.findBySlug(slug)
                .filter(page -> !hasRole(authentication, "ROLE_READER") || page.isPublished())
                .filter(page -> !hasRole(authentication, "ROLE_EMPLOYEE")
                        || authentication.getName().equals(page.getAuthorUsername()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/pages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE')")
    public ResponseEntity<Page> updatePage(@PathVariable Long id, @Valid @RequestBody Page pageDetails,
                                           Authentication authentication) {
        return ResponseEntity.ok(pageService.updatePage(id, pageDetails, authentication));
    }


    // ── PUBLIC ENDPOINT (Für die Content-UI der Webseite) ──
    @GetMapping("/public/pages/{slug}")
    public ResponseEntity<Page> getPageBySlug(@PathVariable String slug) {
        return pageRepository.findBySlugAndPublishedTrue(slug)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // ── ADMIN ENDPOINTS (Geschützt durch Rollenkonzept) ──
    @PostMapping("/pages")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE')")
    public Page createPage(@RequestBody Page page, Authentication authentication) {
        return pageService.createPage(page, authentication);
    }

    @DeleteMapping("/pages/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR', 'EMPLOYEE')")
    public ResponseEntity<?> deletePage(@PathVariable Long id, Authentication authentication) {
        pageService.deletePage(id, authentication);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/pages/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Page> approvePage(@PathVariable Long id) {
        return ResponseEntity.ok(pageService.approvePage(id));
    }

    @PostMapping("/pages/{id}/request-changes")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Page> requestPageChanges(@PathVariable Long id,
                                                   @Valid @RequestBody PageReviewRequest request) {
        if (request.getComments() != null && !request.getComments().isEmpty()) {
            if (request.getComments().stream()
                    .anyMatch(comment -> comment.getEndIndex() <= comment.getStartIndex())) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.BAD_REQUEST,
                        "Die markierten Textbereiche müssen eine positive Länge haben.");
            }
            List<PageCorrectionComment> comments = request.getComments().stream()
                    .map(comment -> new PageCorrectionComment(
                            comment.getStartIndex(),
                            comment.getEndIndex(),
                            comment.getSelectedText().trim(),
                            comment.getFeedback().trim()))
                    .toList();
            return ResponseEntity.ok(pageService.requestChanges(id, comments));
        }
        if (request.getFeedback() == null || request.getFeedback().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Mindestens ein Kommentar oder eine Rückmeldung ist erforderlich.");
        }
        return ResponseEntity.ok(pageService.requestChanges(id, request.getFeedback()));
    }

    @PostMapping("/pages/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'EDITOR')")
    public ResponseEntity<Page> rejectPage(@PathVariable Long id,
                                           @Valid @RequestBody PageReviewRequest request) {
        if (request.getFeedback() == null || request.getFeedback().isBlank()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.BAD_REQUEST,
                    "Eine Begründung für die Ablehnung ist erforderlich.");
        }
        return ResponseEntity.ok(pageService.rejectPage(id, request.getFeedback()));
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> role.equals(authority.getAuthority()));
    }
}
