package com.cms.service;

import com.cms.entity.Page;
import com.cms.repository.PageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PageService {

    @Autowired
    private PageRepository pageRepository;

    public List<Page> getAllPages(Authentication authentication) {
        if (hasRole(authentication, "ROLE_READER")) {
            return pageRepository.findByPublishedTrue();
        }
        if (hasRole(authentication, "ROLE_EMPLOYEE")) {
            return pageRepository.findByAuthorUsername(authentication.getName());
        }
        return pageRepository.findAll();
    }

    public Page getPageBySlug(String slug) {
        return pageRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Page not found with slug: " + slug));
    }

    public Page createPage(Page page, Authentication authentication) {
        if (pageRepository.existsBySlug(page.getSlug())) {
            throw new IllegalArgumentException("Slug already exists!");
        }
        page.setId(null);
        page.setAuthorUsername(authentication.getName());
        if (hasRole(authentication, "ROLE_EMPLOYEE")) {
            page.setPublished(false);
            page.setApprovalStatus(Page.ApprovalStatus.PENDING_APPROVAL);
        } else {
            page.setApprovalStatus(page.isPublished()
                    ? Page.ApprovalStatus.PUBLISHED
                    : Page.ApprovalStatus.DRAFT);
        }
        return pageRepository.save(page);
    }

    public Page updatePage(Long id, Page pageDetails, Authentication authentication) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));

        ensurePageAccess(page, authentication);
        if (hasRole(authentication, "ROLE_EMPLOYEE") && page.isPublished()) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Mitarbeiter dürfen veröffentlichte Beiträge nicht bearbeiten.");
        }
        page.setTitle(pageDetails.getTitle());
        page.setSlug(pageDetails.getSlug());
        page.setContent(pageDetails.getContent());
        page.setMetaDescription(pageDetails.getMetaDescription());
        if (hasRole(authentication, "ROLE_EMPLOYEE")) {
            page.setPublished(false);
            page.setApprovalStatus(Page.ApprovalStatus.PENDING_APPROVAL);
        } else {
            page.setPublished(pageDetails.isPublished());
            page.setApprovalStatus(pageDetails.isPublished()
                    ? Page.ApprovalStatus.PUBLISHED
                    : Page.ApprovalStatus.DRAFT);
        }
        
        return pageRepository.save(page);
    }

    public Page approvePage(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));
        if (page.getApprovalStatus() != Page.ApprovalStatus.PENDING_APPROVAL) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Nur Beiträge mit ausstehender Freigabe können freigegeben werden.");
        }
        page.setPublished(true);
        page.setApprovalStatus(Page.ApprovalStatus.PUBLISHED);
        return pageRepository.save(page);
    }

    public void deletePage(Long id, Authentication authentication) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));
        ensurePageAccess(page, authentication);
        if (hasRole(authentication, "ROLE_EMPLOYEE") && page.isPublished()) {
            throw new org.springframework.web.server.ResponseStatusException(
                    org.springframework.http.HttpStatus.CONFLICT,
                    "Mitarbeiter dürfen veröffentlichte Beiträge nicht löschen.");
        }
        pageRepository.delete(page);
    }

    private void ensurePageAccess(Page page, Authentication authentication) {
        if (hasRole(authentication, "ROLE_EMPLOYEE")
                && !authentication.getName().equals(page.getAuthorUsername())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "Mitarbeiter dürfen nur eigene Beiträge bearbeiten.");
        }
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> role.equals(authority.getAuthority()));
    }
}
