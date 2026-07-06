-- Full-text search em português para Post (title + summary + content)
ALTER TABLE "Post"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('portuguese', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce("summary", '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce("content", '')), 'C')
  ) STORED;

CREATE INDEX "Post_searchVector_idx" ON "Post" USING GIN ("searchVector");
