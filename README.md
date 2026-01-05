# OCRv2

OCR（光学文字認識）機能を備えた商品管理システムです。Google Gemini APIを使用して画像から商品情報を抽出し、PostgreSQLデータベースに保存・管理します。

## 技術スタック

- **フレームワーク**: Next.js 16.1.1
- **データベース**: PostgreSQL (pgvector拡張機能付き)
- **ORM**: Prisma
- **AI**: Google Gemini API
- **状態管理**: Zustand
- **スタイリング**: Tailwind CSS
- **コンテナ**: Docker Compose

## 必要な環境

- Node.js 20以上
- Docker および Docker Compose
- npm、yarn、pnpm、またはbun

## プロジェクトの構築手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/Kakuda25/OCRv2.git
cd OCRv2
```

### 2. 依存関係のインストール

```bash
npm install
# または
yarn install
# または
pnpm install
```

### 3. 環境変数の設定

`env.sample`をコピーして`.env`ファイルを作成し、必要な値を設定します：

```bash
cp env.sample .env
```

`.env`ファイルを編集し、以下の値を設定してください：

```env
# データベース設定（Docker Composeで使用）
POSTGRES_DB=webocr
POSTGRES_USER=postgres
POSTGRES_PASSWORD=masterkey
POSTGRES_PORT=5432
PGADMIN_EMAIL=admin@example.com
PGADMIN_PASSWORD=admin

# Google Gemini API設定
# APIキーは https://aistudio.google.com/app/apikey から取得してください
GEMINI_API_KEY=your_api_key_here

# Prisma用データベース接続URL
DATABASE_URL=postgresql://postgres:masterkey@localhost:5432/webocr?schema=public
```

### 4. データベースの起動

Docker Composeを使用してPostgreSQLデータベースを起動します：

```bash
docker-compose up -d
```

データベースが起動したことを確認：

```bash
docker-compose ps
```

> **注意**: 以前のデータベース設定が残っているとエラーの原因になる場合があります。環境をリセットして再構築する場合は、以下のコマンドを実行してから起動してください：
> ```bash
> docker-compose down -v
> ```

### 5. Prismaのセットアップ

Prismaクライアントを生成し、データベースにマイグレーションを適用します。これによりテーブルが作成されます。

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. シードデータの投入

初期データ（商品データ、発注データ）を投入します：

```bash
npx prisma db seed
```

### 7. 開発サーバーの起動

```bash
npm run dev
# または
yarn dev
# または
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスします。

## その他のコマンド

### データベースの停止

```bash
docker-compose down
```

### データベースのリセット（データを削除）

```bash
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
```

### Prisma Studio（データベース管理ツール）の起動

```bash
npx prisma studio
```

### ビルド

```bash
npm run build
```

### 本番環境での起動

```bash
npm run start
```

## プロジェクト構造

```
OCRv2/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── api/          # API ルート
│   │   ├── cart/         # カートページ
│   │   └── page.tsx      # ホームページ
│   ├── components/       # Reactコンポーネント
│   └── lib/              # ユーティリティ関数
├── prisma/               # Prismaスキーマとシード
├── db/                   # データベース初期化SQL
├── order/                # プロジェクト管理ドキュメント
└── docker-compose.yml    # Docker Compose設定
```

## 機能

- 画像からの商品情報抽出（OCR）
- 商品の検索・管理
- カート機能
- 発注管理

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
