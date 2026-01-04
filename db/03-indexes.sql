-- ============================================
-- インデックス作成: パフォーマンス最適化
-- ============================================

-- 商品コード検索の高速化
CREATE INDEX IF NOT EXISTS idx_products_product_code ON products(product_code);
-- ステータスフィルタの高速化
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
-- 価格範囲検索の高速化
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
-- 作成日時ソートの高速化
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);

-- 商品名・説明の部分一致検索を高速化（pg_trgm拡張機能を使用）
CREATE INDEX IF NOT EXISTS idx_products_name_trgm ON products USING gin(name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_products_description_trgm ON products USING gin(description gin_trgm_ops);

-- カテゴリ検索の高速化
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);

-- ベクトル検索の高速化（HNSWインデックス）
-- cosine distance (vector_cosine_ops) を使用。Geminiの埋め込みベクトルに適している。
CREATE INDEX IF NOT EXISTS idx_products_embedding ON products USING hnsw (embedding vector_cosine_ops);

-- 在庫数検索の高速化
CREATE INDEX IF NOT EXISTS idx_product_stocks_quantity ON product_stocks(quantity);

