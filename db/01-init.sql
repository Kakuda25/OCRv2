-- ============================================
-- 拡張機能の有効化
-- ============================================

-- pg_trgm: 全文検索・類似度検索用（あいまい検索に必要）
-- 商品名や説明文の部分一致検索を高速化する
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- pgvector: ベクトル検索用
-- 商品の埋め込みベクトル（embedding）を用いた意味的検索（Semantic Search）を可能にする
CREATE EXTENSION IF NOT EXISTS "vector";

