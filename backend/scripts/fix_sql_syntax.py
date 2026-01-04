import re

SQL_FILE = "db/04-seed-data.sql"

def fix_sql_syntax():
    print(f"Reading {SQL_FILE}...")
    with open(SQL_FILE, 'r', encoding='utf-8') as f:
        content = f.read()

    # パターン: 
    # VALUES (...), 
    # ON CONFLICT
    # となっている箇所の、ON CONFLICT直前のカンマと空白を除去または修正する
    # ただし、改行やコメントが含まれる可能性があるため、慎重にマッチングさせる

    # 戦略: "ON CONFLICT" の前にある "," を探して削除する
    # 注意: ベクトルデータ内にカンマが含まれるため、単純な置換は危険だが、
    # ON CONFLICTの前にあるカンマは構造上INSERT文の区切り以外ありえない。
    
    # 正規表現:
    # カンマ、任意の空白(改行含む)、ON CONFLICT
    pattern = re.compile(r',\s*(ON CONFLICT)', re.IGNORECASE)
    
    def replacer(match):
        print("  Found syntax error (trailing comma before ON CONFLICT). Fixing...")
        return "\n" + match.group(1) # カンマを削除し、改行 + ON CONFLICT にする

    new_content, count = pattern.subn(replacer, content)

    if count > 0:
        print(f"Fixed {count} occurrences.")
        # バックアップは既に前回のスクリプトで作成されているが、念のため上書き保存前に
        # 現在の状態も .bak2 として保存してもよいが、ここでは直接上書きする
        with open(SQL_FILE, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("File updated successfully.")
    else:
        print("No syntax errors found matching the pattern.")

if __name__ == "__main__":
    fix_sql_syntax()

