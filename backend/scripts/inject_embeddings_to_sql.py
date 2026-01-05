import os
import re
import time
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# API Key check
if not os.getenv("GEMINI_API_KEY"):
    print("Skipping embedding generation: GEMINI_API_KEY not found in .env file.")
    print("Please set GEMINI_API_KEY and try again.")
    exit(0)

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
MODEL_NAME = "models/text-embedding-004"

SQL_FILE = "db/04-seed-data.sql"

def get_embedding(text):
    try:
        result = genai.embed_content(
            model=MODEL_NAME,
            content=text,
            task_type="retrieval_document"
        )
        return result['embedding']
    except Exception as e:
        print(f"  Error: {e}")
        return None

def main():
    if not os.path.exists(SQL_FILE):
        print(f"File not found: {SQL_FILE}")
        return

    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    new_lines = []
    in_products_insert = False
    
    # 正規表現: productsテーブルへのINSERT行のマッチング
    # 例: ((SELECT id FROM categories WHERE name = '機器'), 'EQUIP-001', 'ハンドピース 標準型', '高回転・低振動の標準ハンドピース。日常的な切削に最適。', ...
    line_pattern = re.compile(r"^\s*\(\(SELECT.*?name = '(?P<cat>.*?)'\), '(?P<code>.*?)', '(?P<name>.*?)', '(?P<desc>.*?)',")

    print(f"Processing {SQL_FILE}...")
    
    count = 0
    skip_mode = False

    for line in lines:
        # INSERTヘッダの検出
        if "INSERT INTO products" in line:
            if "embedding" in line:
                print("  'embedding' column already exists. Skipping...")
                skip_mode = True
                in_products_insert = False
            else:
                # カラムリストに embedding を追加
                line = line.replace(") VALUES", ", embedding) VALUES")
                in_products_insert = True
                skip_mode = False
            new_lines.append(line)
            continue

        # INSERTブロック終了判定（簡易的: セミコロンで終わる行）
        if in_products_insert and ");" in line:
            # 最後の行も処理する必要があるため、ここでフラグを落とさず、処理後に落とすか、
            # あるいはブロック内処理ロジックで対応する。
            pass

        if skip_mode:
            new_lines.append(line)
            if ");" in line:
                skip_mode = False
            continue

        if in_products_insert and line.strip().startswith("("):
            match = line_pattern.search(line)
            if match:
                code = match.group('code')
                name = match.group('name')
                desc = match.group('desc')
                
                print(f"  Generating embedding for {code}: {name}...")
                
                text = f"Product Name: {name}\nDescription: {desc}"
                embedding = get_embedding(text)
                
                # Rate limit sleep
                time.sleep(0.5)

                if embedding:
                    vec_str = str(embedding)
                    # 行末の ')' を探して、その前にベクトルデータを挿入
                    r_paren_index = line.rfind(')')
                    if r_paren_index != -1:
                        # vector型としてSQLに埋め込む（文字列形式 '[...]'）
                        new_line = line[:r_paren_index] + f", '{vec_str}'" + line[r_paren_index:]
                        new_lines.append(new_line)
                        count += 1
                        
                        if ");" in line:
                            in_products_insert = False
                        continue
            
            # マッチしない、またはエラー時はそのまま出力（ただしカラム数不一致になる可能性あり）
            # ここでは安全のためそのまま出力するが、警告を出す
            print(f"  Warning: Could not process line: {line.strip()[:50]}...")
            new_lines.append(line)
            
            if ");" in line:
                in_products_insert = False

        else:
            # その他の行
            new_lines.append(line)

    if count > 0:
        print(f"Updated {count} records.")
        # バックアップ作成
        os.rename(SQL_FILE, SQL_FILE + ".bak")
        # 上書き保存
        with open(SQL_FILE, 'w', encoding='utf-8') as f:
            f.writelines(new_lines)
        print("Done.")
    else:
        print("No records updated (maybe already processed?).")

if __name__ == "__main__":
    main()


