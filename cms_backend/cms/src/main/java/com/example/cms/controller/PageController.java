package com.example.cms.controller;

import com.example.cms.entity.Page;
import com.example.cms.service.PageService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pages")
@CrossOrigin(origins = "http://localhost:5000") // Connect to React dev server
public class PageController {

    @Autowired
    private PageService pageService;

    @GetMapping
    public List<Page> getAllPages() {
        return pageService.getAllPages();
    }

    @GetMapping("/{slug}")
    public ResponseEntity<Page> getPageBySlug(@PathVariable String slug) {
        return ResponseEntity.ok(pageService.getPageBySlug(slug));
    }

    @PostMapping
    public ResponseEntity<Page> createPage(@Valid @RequestBody Page page) {
        return ResponseEntity.ok(page.createPage(page));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Page> updatePage(@PathVariable Long id, @Valid @RequestBody Page pageDetails) {
        return ResponseEntity.ok(pageService.updatePage(id, pageDetails));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePage(@PathVariable Long id) {
        pageService.deletePage(id);
        return ResponseEntity.noContent().build();
    }
}
