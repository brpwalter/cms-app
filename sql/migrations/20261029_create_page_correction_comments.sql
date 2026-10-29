CREATE TABLE IF NOT EXISTS public.page_correction_comments (
    page_id BIGINT NOT NULL REFERENCES public.pages(id) ON DELETE CASCADE,
    comment_order INTEGER NOT NULL,
    start_index INTEGER NOT NULL CHECK (start_index >= 0),
    end_index INTEGER NOT NULL CHECK (end_index > start_index),
    selected_text TEXT NOT NULL,
    feedback TEXT NOT NULL,
    PRIMARY KEY (page_id, comment_order)
);
