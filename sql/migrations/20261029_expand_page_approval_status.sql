ALTER TABLE public.pages
    DROP CONSTRAINT IF EXISTS pages_approval_status_check;

ALTER TABLE public.pages
    ADD CONSTRAINT pages_approval_status_check
    CHECK (approval_status IN (
        'DRAFT',
        'PENDING_APPROVAL',
        'CHANGES_REQUESTED',
        'REJECTED',
        'PUBLISHED'
    ));
