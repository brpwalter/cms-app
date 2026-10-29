package com.cms.dto;

import jakarta.validation.Valid;
import java.util.List;

public class PageReviewRequest {

    private String feedback;

    @Valid
    private List<PageCorrectionCommentRequest> comments;

    public String getFeedback() {
        return feedback;
    }

    public void setFeedback(String feedback) {
        this.feedback = feedback;
    }

    public List<PageCorrectionCommentRequest> getComments() {
        return comments;
    }

    public void setComments(List<PageCorrectionCommentRequest> comments) {
        this.comments = comments;
    }
}
