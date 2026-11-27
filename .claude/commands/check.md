---
description: フロントとバックのビルド・整形をまとめて確認する
---

このリポジトリの変更が壊れていないかを確認してください。

1. `frontend/` で `npm run format:check` を実行し、整形ルールに合っているかを確認する
2. `frontend/` で `npm run build` を実行する。ただし `npm run dev` が起動中だと `.next` を共有して競合するので、起動中なら作業用フォルダにコピーしてビルドする
3. `backend/` で `gradle compileJava` を実行する。Gradle は JDK 17〜24 で動かし、toolchain は Java 21
4. API や業務ルールを変更している場合は、`backend/src/main/java/jp/molino/skill/` と `frontend/lib/server/data.js` の両方が同じ仕様になっているかを確認する

結果は「成功したこと」「失敗したこと（エラー全文と原因）」「確認できなかったこと」に分けて報告してください。未実行のものを成功と書かないでください。
