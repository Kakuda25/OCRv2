-- ============================================
-- Purchase orders: 発注書（確定済み）+ 明細の保存用スキーマ
-- ============================================
-- 目的:
--   - 発注書（確定済み）のヘッダ情報と、明細（商品ID・数量など）を保存する
--   - OCR結果（raw JSON）や候補などの一時データはDBに保存しない

-- updated_at 自動更新トリガー
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_proc
        WHERE proname = 'update_updated_at_column'
    ) THEN
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $f$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $f$ LANGUAGE plpgsql;
    END IF;
END $$;

-- 既存テーブルの再作成
DROP TABLE IF EXISTS purchase_order_items;
DROP TABLE IF EXISTS purchase_orders;

-- 発注書（ヘッダ）
-- IDと作成日時のみのシンプルな構成
CREATE TABLE purchase_orders (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_at ON purchase_orders(created_at);

DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
CREATE TRIGGER update_purchase_orders_updated_at
    BEFORE UPDATE ON purchase_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 発注明細（商品ID + 数量など）
CREATE TABLE purchase_order_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_order_id BIGINT NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_index INTEGER NOT NULL,
    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity NUMERIC(12, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (purchase_order_id, line_index)
);

CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order_id
    ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_product_id
    ON purchase_order_items(product_id);

DROP TRIGGER IF EXISTS update_purchase_order_items_updated_at ON purchase_order_items;
CREATE TRIGGER update_purchase_order_items_updated_at
    BEFORE UPDATE ON purchase_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
