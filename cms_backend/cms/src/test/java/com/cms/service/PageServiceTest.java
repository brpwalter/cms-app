package com.cms.service;

import com.cms.entity.Page;
import com.cms.entity.PageCorrectionComment;
import com.cms.repository.PageRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.access.AccessDeniedException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PageServiceTest {

    @Mock
    private PageRepository pageRepository;

    @InjectMocks
    private PageService pageService;

    private Page pendingPage;

    @BeforeEach
    void setUp() {
        pendingPage = new Page();
        pendingPage.setId(1L);
        pendingPage.setPublished(false);
        pendingPage.setApprovalStatus(Page.ApprovalStatus.PENDING_APPROVAL);
        lenient().when(pageRepository.findById(1L)).thenReturn(Optional.of(pendingPage));
    }

    @Test
    void requestChangesStoresFeedbackAndReturnsPageToEmployee() {
        when(pageRepository.save(pendingPage)).thenReturn(pendingPage);
        Page result = pageService.requestChanges(1L, "Bitte Quellen ergänzen.");

        assertEquals(Page.ApprovalStatus.CHANGES_REQUESTED, result.getApprovalStatus());
        assertEquals("Bitte Quellen ergänzen.", result.getCorrectionFeedback());
        assertFalse(result.isPublished());
        verify(pageRepository).save(pendingPage);
    }

    @Test
    void rejectPageStoresReasonAndKeepsPageUnpublished() {
        when(pageRepository.save(pendingPage)).thenReturn(pendingPage);
        Page result = pageService.rejectPage(1L, "Der Beitrag passt nicht zum Thema.");

        assertEquals(Page.ApprovalStatus.REJECTED, result.getApprovalStatus());
        assertEquals("Der Beitrag passt nicht zum Thema.", result.getCorrectionFeedback());
        assertFalse(result.isPublished());
        verify(pageRepository).save(pendingPage);
    }

    @Test
    void reviewActionsRequirePendingApproval() {
        pendingPage.setApprovalStatus(Page.ApprovalStatus.PUBLISHED);

        assertThrows(ResponseStatusException.class,
                () -> pageService.requestChanges(1L, "Bitte korrigieren."));
        assertThrows(ResponseStatusException.class,
                () -> pageService.rejectPage(1L, "Abgelehnt."));
    }

    @Test
    void employeeUpdateResubmitsPageAndClearsEditorFeedback() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("employee");
        doReturn(java.util.List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .when(authentication).getAuthorities();
        when(pageRepository.save(pendingPage)).thenReturn(pendingPage);
        pendingPage.setAuthorUsername("employee");
        pendingPage.setApprovalStatus(Page.ApprovalStatus.CHANGES_REQUESTED);
        pendingPage.setCorrectionFeedback("Bitte Quellen ergänzen.");
        Page correction = new Page();
        correction.setTitle("Überarbeiteter Titel");
        correction.setSlug("ueberarbeitet");
        correction.setContent("Überarbeiteter Inhalt");

        Page result = pageService.updatePage(1L, correction, authentication);

        assertEquals(Page.ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals("Überarbeiteter Titel", result.getTitle());
        assertNull(result.getCorrectionFeedback());
        assertFalse(result.isPublished());
        verify(pageRepository).save(pendingPage);
    }

    @Test
    void editorUpdateKeepsPendingPageUnpublished() {
        Authentication authentication = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_EDITOR")))
                .when(authentication).getAuthorities();
        pendingPage.setAuthorUsername("employee");
        when(pageRepository.save(pendingPage)).thenReturn(pendingPage);
        Page correction = new Page();
        correction.setTitle("Korrigierter Titel");
        correction.setSlug("korrigierter-titel");
        correction.setContent("Korrigierter Inhalt");
        correction.setPublished(true);

        Page result = pageService.updatePage(1L, correction, authentication);

        assertEquals(Page.ApprovalStatus.PENDING_APPROVAL, result.getApprovalStatus());
        assertEquals("Korrigierter Titel", result.getTitle());
        assertFalse(result.isPublished());
        verify(pageRepository).save(pendingPage);
    }

    @Test
    void editorCannotDirectlyEditPublishedPage() {
        Authentication authentication = mock(Authentication.class);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_EDITOR")))
                .when(authentication).getAuthorities();
        pendingPage.setApprovalStatus(Page.ApprovalStatus.PUBLISHED);
        pendingPage.setPublished(true);

        assertThrows(AccessDeniedException.class,
                () -> pageService.updatePage(1L, new Page(), authentication));
    }

    @Test
    void employeePageListIncludesOwnCorrectionComments() {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("employee");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_EMPLOYEE")))
                .when(authentication).getAuthorities();
        pendingPage.setAuthorUsername("employee");
        pendingPage.setApprovalStatus(Page.ApprovalStatus.CHANGES_REQUESTED);
        pendingPage.setCorrectionFeedback(null);
        pendingPage.setCorrectionComments(List.of(
                new PageCorrectionComment(4, 12, "alter Text", "Bitte präzisieren.")));
        when(pageRepository.findByAuthorUsername("employee")).thenReturn(List.of(pendingPage));

        List<Page> pages = pageService.getAllPages(authentication);

        assertEquals(1, pages.size());
        assertEquals("Bitte präzisieren.", pages.get(0).getCorrectionComments().get(0).getFeedback());
        verify(pageRepository).findByAuthorUsername("employee");
    }

    @Test
    void requestChangesStoresCommentsAnchoredToSelectedText() {
        when(pageRepository.save(pendingPage)).thenReturn(pendingPage);
        List<PageCorrectionComment> comments = List.of(
                new PageCorrectionComment(4, 12, "alter Text", "Bitte präzisieren."),
                new PageCorrectionComment(20, 25, "2024.", "Quelle ergänzen."));

        Page result = pageService.requestChanges(1L, comments);

        assertEquals(Page.ApprovalStatus.CHANGES_REQUESTED, result.getApprovalStatus());
        assertNull(result.getCorrectionFeedback());
        assertEquals(2, result.getCorrectionComments().size());
        assertEquals("alter Text", result.getCorrectionComments().get(0).getSelectedText());
        assertEquals("Bitte präzisieren.", result.getCorrectionComments().get(0).getFeedback());
        verify(pageRepository).save(pendingPage);
    }
}
