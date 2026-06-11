# 方程式の解の様子を見てみよう

係数空間の点を動かしながら、1次から4次までの方程式の解の変化と判別集合を観察するための静的Webページです。

## ファイル構成

- `index.html`: ページ本体
- `styles.css`: 見た目
- `app.js`: 描画と操作ロジック
- `start-preview.ps1`: ローカル確認用の簡易サーバー

ビルド作業は不要です。GitHub Pages に置けばそのまま動きます。

## ローカルで確認する

PowerShell でこのフォルダに移動して、次を実行します。

```powershell
.\start-preview.ps1
```

ブラウザで `http://127.0.0.1:8000/` を開きます。

## GitHub Pages で公開する手順

1. GitHub で新しいリポジトリを作ります。
   - 例: `equation-discriminant-viewer`
   - Public リポジトリにすると GitHub Pages で公開しやすいです。

2. このフォルダの中身をリポジトリにアップロードします。
   - GitHub のリポジトリ画面で `Add file` → `Upload files`
   - `index.html`, `styles.css`, `app.js`, `README.md`, `.nojekyll`, `.editorconfig`, `.gitattributes`, `start-preview.ps1` をまとめてドラッグ
   - `Commit changes` を押します。

3. GitHub Pages を有効にします。
   - リポジトリの `Settings` を開く
   - 左メニューの `Pages` を開く
   - `Build and deployment` の `Source` を `Deploy from a branch` にする
   - `Branch` を `main`、フォルダを `/ (root)` にする
   - `Save` を押します。

4. 数分待つと公開URLが表示されます。
   - 例: `https://ユーザー名.github.io/equation-discriminant-viewer/`

## 更新するとき

ファイルを修正して GitHub に再アップロード、または Git で push すれば自動で更新されます。反映まで少し時間がかかることがあります。

