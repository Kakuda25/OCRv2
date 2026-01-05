import os
import time
import psycopg2
from psycopg2.extras import DictCursor
import google.generativeai as genai
from dotenv import load_dotenv

# .envファイルの読み込み
load_dotenv()

# 環境変数の取得
DB_HOST = os.getenv("POSTGRES_HOST", "localhost")
DB_NAME = os.getenv("POSTGRES_DB", "webocr")
DB_USER = os.getenv("POSTGRES_USER", "postgres")
DB_PASS = os.getenv("POSTGRES_PASSWORD", "masterkey")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("Error: GEMINI_API_KEY is not set in environment variables.")
    exit(1)

# Geminiの設定
genai.configure(api_key=GEMINI_API_KEY)
# Gemini 3.0 FlashのEmbeddingモデルを指定
# ※モデル名は変更になる可能性があります。text-embedding-004 は安定して利用可能です。
MODEL_NAME = "models/text-embedding-004"

def get_embedding(text):
    """Gemini APIを使用してテキストの埋め込みベクトルを取得する"""
    try:
        result = genai.embed_content(
            model=MODEL_NAME,
            content=text,
            task_type="retrieval_document",
            title="Product Description"
        )
        return result['embedding']
    except Exception as e:
        print(f"Error getting embedding: {e}")
        return None

def main():
    print("Connecting to database...")
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT
        )
        cur = conn.cursor(cursor_factory=DictCursor)
        
        # vector拡張が有効か確認
        cur.execute("CREATE EXTENSION IF NOT EXISTS vector;")
        
        # Embeddingが未設定、または全商品を対象に更新
        print("Fetching products...")
        cur.execute("SELECT id, name, description FROM products")
        products = cur.fetchall()
        
        print(f"Found {len(products)} products. Starting embedding generation...")
        
        count = 0
        for product in products:
            p_id = product['id']
            name = product['name']
            description = product['description']
            
            # ベクトル化するテキストを作成（商品名と説明を組み合わせる）
            text_to_embed = f"Product Name: {name}\nDescription: {description}"
            
            # APIレートリミットへの配慮（必要に応じて調整）
            time.sleep(0.5) 
            
            embedding = get_embedding(text_to_embed)
            
            if embedding:
                # pgvector形式で更新
                cur.execute(
                    "UPDATE products SET embedding = %s WHERE id = %s",
                    (embedding, p_id)
                )
                count += 1
                if count % 5 == 0:
                    print(f"Processed {count}/{len(products)} products...")
                    conn.commit()
            else:
                print(f"Skipping product ID {p_id} due to API error.")

        conn.commit()
        print(f"Successfully updated embeddings for {count} products.")

    except Exception as e:
        print(f"Database error: {e}")
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    main()


