# script-sandbox

運用スクリプトを題材にしたJS/TS sandbox。運用メンバーが手作業で流しているSQLを、入力(CSV)と
テンプレートのプレースホルダーから再現し、（将来は）Backlogチケットとして起票する AI駆動ワークフローを構築する。

## このプロジェクトの目的（価値観・全担当の前提）

- **忠実な再現が第一**：入力(CSV)とテンプレートの `{{...}}` プレースホルダーを使い、運用メンバーが
  実際に手作業で流しているSQL（`manual.sql`）を**忠実に再現**して生成する。勝手な最適化・改変はしない。
- **価値の測り方**：フラグ更新・固定値更新など個々のSQLは小さく、**作業時間そのものの削減効果は出しにくい**。
  狙いは労働時間削減ではなく、**手入力の省略と、集中力が細切れになる要因の除去**。これにより運用メンバーが
  空いたリソースをドメイン検討など別タスクへ振り向けられることを価値とする。
- **提案の判断軸**：lookup select やリファクタの提案も、「作業時間削減」ではなく
  「手入力・文脈切り替えの削減」の観点で価値を測る。過剰な汎用化はしない。

## アーキテクチャ（責務分割）

テンプレSQL・レシピは Backlog に外出しし、コード（この repo）は「前処理」に専念する。

- **Backlog**: チケットレシピ＋テンプレSQL（更新用SQLの正。運用メンバーがレビュー）。
- **Agent**: レシピ解釈・リテラル置換・日付計算・最終SQL組み立て・静的安全チェック・起票。
- **前処理コア（この repo, `src/lib/`）**: CSV解析・lookup（DB参照）。テンプレSQLは持たない。
  - `csv.ts` — `parseCsv`（CSV解析）
  - `queries.ts` — lookup（`fetchInvoiceIds`/`fetchSalesIds`。将来は宣言的な汎用実行器へ）
  - `db.ts` — DB接続

将来像とシーケンスは `doc/architecture/ticket-workflow.md`、具体的なオペレーション例は
`doc/operation-pattern-example.md` を参照。

## 運用ワークフロー（担当エージェント）

新しい定例の作成は、フェーズごとの担当エージェント（`.claude/agents/`）で進める。

| フェーズ | 担当 | 主な成果物 |
| --- | --- | --- |
| 要件 | requirements-analyst | `doc/requirements/<name>/<name>.md` |
| 設計 | designer | `doc/requirements/<name>/design.md` |
| 実装 | implementer | 前処理コード（必要時）＋ Backlogのレシピ/テンプレ |
| テスト | tester | vitest（単体＋結合） |
| ドキュメント/レビュー/PJ管理 | documenter / reviewer / new-routine スキル | （未整備） |

## テスト

- `npm test` — 単体（純粋な前処理。`*.integration.test.ts` は除外）。
- `npm run test:integration` — 結合（lookup×DB。`docker compose up -d db` が前提）。
- 方針は `doc/testing-policy.md`。**受入（生成SQLの忠実性）・日付**はコードでなく Agent の確認観点で担保する。

## DB

- スキーマ/seed: `docker/mysql/init/`（初回コンテナ作成時のみ実行）。スキーマ変更の反映は
  `docker compose down -v && docker compose up -d db` が必要。
- dump復元: `docker/mysql/dump/`（手動配置＋手動復元。スキーマ空ダンプ `schema.sql` も可）。
- 金額カラムは `INT`、ID系は `BIGINT`、論理削除は `logical_delete_flag TINYINT NOT NULL DEFAULT 0`。

## 日付の扱い（Agentの確認観点）

日付計算（締日・入金日など）は **Agent の責務**（コードには持たない）。過去に踏んだ落とし穴を
再発させないため、Agent が日付を出したら次を確認する（詳細は `doc/architecture/ticket-workflow.md` §5）:

- 週末・日本の祝日をまたぐ「◯営業日後」は翌営業日へ繰り上がっているか。
- 入金予定日=入金猶予日の同日仕様など、要件どおりか。
- 「翌月初」等の起点月がズレていないか。
- SQL上は `'YYYY-MM-DD'` とクォート付きの日付リテラルか（`2026-07-15` の数値計算に化けていないか）。
