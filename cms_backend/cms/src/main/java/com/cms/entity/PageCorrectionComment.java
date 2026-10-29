package com.cms.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class PageCorrectionComment {

    @Column(name = "start_index", nullable = false)
    private int startIndex;

    @Column(name = "end_index", nullable = false)
    private int endIndex;

    @Column(name = "selected_text", nullable = false, columnDefinition = "TEXT")
    private String selectedText;

    @Column(name = "feedback", nullable = false, columnDefinition = "TEXT")
    private String feedback;

    public PageCorrectionComment() {
    }

    public PageCorrectionComment(int startIndex, int endIndex, String selectedText, String feedback) {
        this.startIndex = startIndex;
        this.endIndex = endIndex;
        this.selectedText = selectedText;
        this.feedback = feedback;
    }

    public int getStartIndex() {
        return startIndex;
    }

    public int getEndIndex() {
        return endIndex;
    }

    public String getSelectedText() {
        return selectedText;
    }

    public String getFeedback() {
        return feedback;
    }
}
