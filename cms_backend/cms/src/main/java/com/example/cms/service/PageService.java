package com.example.cms.service;

import com.example.cms.entity.Page;
import com.example.cms.repository.PageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PageService {

    @Autowired
    private PageRepository pageRepository;

    public List<Page> getAllPages() {
        return pageRepository.findAll();
    }

    public Page getPageBySlug(String slug) {
        return pageRepository.findBySlug(slug)
                .orElseThrow(() -> new RuntimeException("Page not found with slug: " + slug));
    }

    public Page createPage(Page page) {
        if (pageRepository.existsBySlug(page.getSlug())) {
            throw new IllegalArgumentException("Slug already exists!");
        }
        return pageRepository.save(page);
    }

    public Page updatePage(Long id, Page pageDetails) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));
        
        page.setTitle(pageDetails.getTitle());
        page.setSlug(pageDetails.getSlug());
        page.setContent(pageDetails.getContent());
        page.setMetaDescription(pageDetails.getMetaDescription());
        page.setPublished(pageDetails.isPublished());
        
        return pageRepository.save(page);
    }

    public void deletePage(Long id) {
        Page page = pageRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Page not found with id: " + id));
        pageRepository.delete(page);
    }
}
