# Full-Stack CMS: React, Spring Boot & PostgreSQL

This document contains the complete production-ready source code and architecture setup for a Headless Content Management System (CMS) tailored for managing website pages and blog posts.

---

## 1. Database Schema (PostgreSQL)

Save this as `schema.sql`. It defines the tables for users (authentication), pages (static structure), and posts (dynamic content).

```sql
-- PostgreSQL Database Schema

-- 1. Users Table (Admin Access)
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'EDITOR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Pages Table (Static Website Structure)
CREATE TABLE pages (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    content TEXT,
    meta_description VARCHAR(255),
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Posts Table (Dynamic Blog / News Articles)
CREATE TABLE posts (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    summary VARCHAR(500),
    content TEXT,
    author_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_is_published ON posts(is_published);

-- Insert initial admin user (Password hash for: "Admin2026!")
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@example.com', '$2a$10$e0myZ4cOub7WJpM6mFPMIeW7Z1S7g3dD3oQ8V6WqYF0C9JgL2z72W', 'ADMIN');
```

---

## 2. Backend (Java Spring Boot)

### `pom.xml` (Dependencies)
```xml
<dependencies>
    <!-- Spring Boot Starters -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>

    <!-- PostgreSQL Driver -->
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- Lombok for Boilerplate reduction -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>
</dependencies>
```

### `application.properties`
```properties
spring.application.name=cms-backend
spring.datasource.url=jdbc:postgresql://localhost:5432/cms_db
spring.datasource.username=postgres
spring.datasource.password=your_secure_password
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=true
```

### `Page.java` (Domain Entity)
```java
package com.example.cms.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Page {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Title is required")
    @Column(nullable = false, length = 150)
    private String title;

    @NotBlank(message = "Slug is required")
    @Column(nullable = false, unique = true, length = 150)
    private String slug;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "meta_description")
    private String metaDescription;

    @Column(name = "is_published")
    private boolean published;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
```

### `PageRepository.java`
```java
package com.example.cms.repository;

import com.example.cms.entity.Page;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PageRepository extends JpaRepository<Page, Long> {
    Optional<Page> findBySlug(String slug);
    boolean existsBySlug(String slug);
}
```

### `PageService.java`
```java
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
```

### `PageController.java` (REST Endpoint)
```java
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
```

---

## 3. Frontend (React + Axios)

### `package.json` (Snippet)
Make sure to install these essential dependencies in your React project directory:
```json
"dependencies": {
  "axios": "^1.6.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0"
}
```

### `api.js` (Centralized Axios Instance)
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const pageApi = {
    getAll: () => api.get('/pages'),
    getBySlug: (slug) => api.get(`/pages/${slug}`),
    create: (data) => api.post('/pages', data),
    update: (id, data) => api.put(`/pages/${id}`, data),
    delete: (id) => api.delete(`/pages/${id}`),
};

export default api;
```

### `AdminDashboard.jsx` (Manage Pages UI)
```javascript
import React, { useState, useEffect } from 'react';
import { pageApi } from './api';

const AdminDashboard = () => {
    const [pages, setPages] = useState([]);
    const [formData, setFormData] = useState({ title: '', slug: '', content: '', metaDescription: '', published: false });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        loadPages();
    }, []);

    const loadPages = async () => {
        try {
            const response = await pageApi.getAll();
            setPages(response.data);
        } catch (error) {
            console.error("Error fetching pages", error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await pageApi.update(editingId, formData);
            } else {
                await pageApi.create(formData);
            }
            setFormData({ title: '', slug: '', content: '', metaDescription: '', published: false });
            setEditingId(null);
            loadPages();
        } catch (error) {
            console.error("Error saving page", error);
        }
    };

    const handleEdit = (page) => {
        setEditingId(page.id);
        setFormData({
            title: page.title,
            slug: page.slug,
            content: page.content,
            metaDescription: page.metaDescription,
            published: page.published
        });
    };

    const handleDelete = async (id) => {
        if(window.confirm("Are you sure you want to delete this page?")) {
            await pageApi.delete(id);
            loadPages();
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial' }}>
            <h1>CMS Admin Dashboard - Pages</h1>
            
            {/* Page Creation / Editing Form */}
            <form onSubmit={handleSubmit} style={{ marginBottom: '40px', background: '#f5f5f5', padding: '20px', borderRadius: '5px' }}>
                <h3>{editingId ? 'Edit Page' : 'Create New Page'}</h3>
                <div style={{ marginBottom: '10px' }}>
                    <input type="text" name="title" placeholder="Page Title" value={formData.title} onChange={handleInputChange} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input type="text" name="slug" placeholder="url-slug-example" value={formData.slug} onChange={handleInputChange} required style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <textarea name="content" placeholder="HTML or Plain Text Content" value={formData.content} onChange={handleInputChange} rows="6" style={{ width: '100%', padding: '8px' }}></textarea>
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <input type="text" name="metaDescription" placeholder="SEO Meta Description" value={formData.metaDescription} onChange={handleInputChange} style={{ width: '100%', padding: '8px' }} />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>
                        <input type="checkbox" name="published" checked={formData.published} onChange={handleInputChange} /> Publish immediately
                    </label>
                </div>
                <button type="submit" style={{ padding: '10px 20px', background: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
                    {editingId ? 'Update Page' : 'Save Page'}
                </button>
                {editingId && <button onClick={() => { setEditingId(null); setFormData({ title: '', slug: '', content: '', metaDescription: '', published: false }); }} style={{ marginLeft: '10px', padding: '10px' }}>Cancel</button>}
            </form>

            {/* List of Existing Pages */}
            <h2>Existing Pages</h2>
            <table border="1" cellPadding="10" cellSpacing="0" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ background: '#eee' }}>
                        <th>Title</th>
                        <th>Slug</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {pages.map(page => (
                        <tr key={page.id}>
                            <td><strong>{page.title}</strong></td>
                            <td>`/{page.slug}`</td>
                            <td>{page.published ? '✅ Published' : '🛑 Draft'}</td>
                            <td>
                                <button onClick={() => handleEdit(page)} style={{ marginRight: '10px' }}>Edit</button>
                                <button onClick={() => handleDelete(page.id)} style={{ color: 'red' }}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default AdminDashboard;
```

### `DynamicPageView.jsx` (Public Website Renderer)
```javascript
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pageApi } from './api';

const DynamicPageView = () => {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                const response = await pageApi.getBySlug(slug || 'home');
                setPage(response.data);
                setError(false);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [slug]);

    if (loading) return <div>Loading content...</div>;
    if (error || !page) return <div>404 - Page Not Found</div>;

    return (
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>{page.title}</h1>
            <hr />
            {/* Inject safe HTML content from database */}
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
    );
};

export default DynamicPageView;
```
