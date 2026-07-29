# script-sandbox

運用スクリプトを題材にしたJS/TS練習用sandbox。CSVから実行用SQLを生成するルーティン群を持つ。

## ルーティンの構成

`src/script/routine/<name>/` が1ルーティン。各ディレクトリの構成:

- `script.ts` — エントリポイント。`parseArgs()` でCLI引数を検証し、CSVとテンプレートからSQLを生成して `data/out.sql` に出力する。
- `<name>.template.sql` — `{{key}}` プレースホルダーを含むSQLテンプレート。
- `data/in.csv` — 入力（手動配置）。
- `README.md` — 目的・入力・パラメータ・実行方法。
- `_sets/*.md` — 複数ルーティンをまとめて実行するためのセット定義。

npm スクリプト名は `package.json` の `scripts`（`csv-to-sql:*`）を参照。

## 月次定例の実行

AI駆動で定例を回すワークフローは `.claude/skills/run-routine/` にスキル化されている。
「定例フォルダを実行して」等で起動する。詳細はそのSKILL.mdを参照。

## 新しいルーティンを追加するとき

1. `src/script/routine/<name>/` を作り、`script.ts`・`template.sql`・`README.md` を用意する。
2. `package.json` の `scripts` に `csv-to-sql:<name>` を追加する。
3. `.claude/skills/run-routine/SKILL.md` の「現在のルーティン一覧」表を更新する。
4. 定例セットに含めるなら該当の `_sets/*.md` にも追記する。

## DB

- スキーマ/seed: `docker/mysql/init/`（初回コンテナ作成時のみ実行）。
- dump復元: `docker/mysql/dump/`（手動配置＋手動復元）。
- 金額カラムは `INT`、ID系は `BIGINT`、論理削除は `logical_delete_flag TINYINT NOT NULL DEFAULT 0`。

## 日付の扱い（重要）

このプロジェクトの日付は時刻・TZの概念を持たない「日付リテラル（暦日）」として扱う。
実装は **ローカル系メソッドで一貫させる**（UTC系と混ぜない）。理由は依存する
`jp-holidays` が `getFullYear/getMonth/getDate` などローカル系で日付を読むため。

- 文字列 → Date: `parseDate("YYYY-MM-DD")`（`src/lib/dateUtils.ts`）を使う。
  `new Date("YYYY-MM-DD")` は **UTC解釈**になり負オフセットのTZでズレるため使わない。
- Date → 文字列: `formatDate`（ローカルの Y/M/D を組み立て）。`toISOString()` は使わない。
- 月初などの構築も `new Date(y, m, 1)`（ローカル）。`Date.UTC(...)` と混在させない。
- 系統を混ぜると JST では偶然通っても UTC/負オフセットのTZ（CI等）で壊れる。
  テストは `TZ=UTC` / `TZ=America/New_York` でも通ることを確認する。
