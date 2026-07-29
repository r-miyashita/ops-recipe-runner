---
name: run-routine
description: 月次定例のルーティンスクリプト(src/script/routine配下)をAI駆動で実行する。「定例フォルダを実行して」「定例を回して」等で起動。CSV/dump手動配置後、パラメータを確認し、確認表を提示してから実行、出力パスを報告する。
---

# 月次定例ルーティン実行ワークフロー

`src/script/routine/` 配下のルーティンスクリプトを実行する。ユーザーは事前に
(1) 各ルーティンの `data/in.csv` を手動配置、(2) DB dump を `docker/mysql/dump/` に手動配置
した状態で「定例フォルダを実行して」等と依頼してくる。

## 実行モード（起動時に判定）

依頼内容から以下のいずれかを判定する。曖昧なら**どのモードか質問する**。

| モード | トリガー例 | 対象 |
| --- | --- | --- |
| 全実行 | 「定例フォルダを実行して」「全部回して」 | `src/script/routine/` 直下の全ルーティン |
| テンプレート実行 | 「monthlyセットで実行」「◯◯セットで」 | `src/script/routine/_sets/<name>.md` に列挙されたルーティン |
| テンポラリ | 「updateSalesInfoだけ」「今回はこれとこれ」 | 会話で指定されたルーティンのみ |

## 手順

### 1. 対象ルーティンの確定
- モードに応じて実行対象のルーティン一覧を確定する。
- 各ルーティンのディレクトリに `data/in.csv` が存在するか確認する。無ければ**その場で警告し、実行対象から外すか続行するか確認**する。

### 2. dump の復元（必要な場合）
- `docker/mysql/dump/` に `.sql` ファイルがあるか確認する。
- ある場合、DB起動 → dump復元を行う。無い場合は seed のみで進む旨を伝える。
  ```bash
  docker compose up -d db
  # healthcheck完了を待ってから
  docker compose exec -T db mysql -uroot -proot sandbox < docker/mysql/dump/<file>.sql
  ```
- 復元はDBを上書きする破壊的操作なので、**実行前に必ずユーザーへ確認**する。

### 3. パラメータの確定
- 各ルーティンの `script.ts` の `parseArgs()` を読み、必要な引数と形式を把握する（`package.json` の `scripts` にnpm名がある）。
- 会話内に値があれば拾う（例: 「userId=1018、variation=Aで7月分」）。

**共通パラメータ（全ルーティン横断・同じ断面で処理）**
- `userId` = いま作業しているメンバーのオペレーターID。
- `baseDate` = 月次の基準日。**処理月から月初（`YYYY-MM-01`）を導出**し、全ルーティンで共通に使う。

**聞き方（値が無いときはユーザーの言葉で簡潔に質問）**
- まず「作業者ID（userId）と処理月を教えてください」と聞く。
- 処理月が示されたら、基準日を確認する。例: 処理月が7月なら「基準日は 2026-07-01 でよいですか？」と聞いてから確定する。
- `variation` 等、ルーティン固有のパラメータで会話に無いものは併せて質問する（例: updateSalesInfo の A/B/C）。
- 具体的なIDや月を勝手に仮定しない（例の `1018` を既定値にしない）。必ず確認する。

### 4. 実行前の確認表を提示（必須）
実行前に必ず以下の表を提示し、ユーザーの了承（「OK」「実行して」等）を得てから実行する。

| ルーティン | npmスクリプト | パラメータ | in.csv | 出力先 |
| --- | --- | --- | --- | --- |
| updateSalesInfo | csv-to-sql:updateSalesInfo | --userId=1018 --variation=A | ✔ (5件) | data/out.sql |

### 5. 実行
- 了承後、各ルーティンを順に実行する。
  ```bash
  npm run <npmスクリプト名> -- --userId=1018 --variation=A
  ```
- 途中でエラーが出たら止めて内容を報告する（後続を続けるか確認）。

### 6. 完了報告
- 各ルーティンの `data/out.sql` の**絶対パス**を一覧で報告する。
- 生成SQLは自動実行せず、「確認のうえDBへ流してください」と添える。

## 現在のルーティン一覧（参考・追加時は要更新）

| ルーティン | npmスクリプト | パラメータ |
| --- | --- | --- |
| updateSalesInfo | csv-to-sql:updateSalesInfo | `--userId`(数値) / `--variation`(A/B/C) |
| updateShipmentDate | csv-to-sql:updateShipmentDateAndCloseDate | `--userId`(数値) / `--baseDate`(YYYY-MM-DD) |

> 新しいルーティンを追加したら、この表と各 `_sets/*.md` を更新すること。
> パラメータ仕様は各 `script.ts` の `parseArgs()` が正となる（この表が食い違う場合はコードを信頼）。
