# 用語集（グロッサリー）

このプロジェクトの正準な呼称一覧。ドキュメント・エージェント定義・図（mermaid）で用語が
揺れないよう、**新しい用語を使うとき／既存の用語に迷ったときはここを見る**。
レビュー担当は一貫性チェックの基準としてここを参照する。

## 登場人物・コンポーネント

| 用語 | 意味 | 状態 |
| --- | --- | --- |
| **Host** | 運用メンバー（人間）。Agentに依頼し、パラメータを確認し、最終SQLを承認する | 実装済み |
| **Claude Agent（Agent）** | レシピ解釈・リテラル置換・日付計算・最終SQL組み立て・静的安全チェック・起票を行うAIオーケストレーター | 実装済み |
| **Script Runner** | このリポジトリ（script-sandbox）自体。CSV解析・宣言的lookup実行など「前処理」の実行環境。テンプレSQL・レシピの実体は持たない | 実装済み |
| **Local DB Container** | 任意のdumpからMySQLを起動するDockerコンテナ（`docker-compose.yml`の`db`サービス）。クエリの中身は一切知らない受動的なDB提供元。Script Runner（`lookup.ts`/`db.ts`）が直接接続してクエリを実行する | 実装済み |
| **Backlog MCP** | レシピ（テンプレSQL含む）の保管、チケットの起票・追記を担う外部連携（Backlog MCPサーバー経由） | 実装済み |

## データ・成果物

| 用語 | 意味 |
| --- | --- |
| **レシピ（Recipe）** | Backlogドキュメントとして登録される、1定例分のテンプレSQL＋パラメータ定義＋lookup宣言＋安全設定のセット。正準フォーマットは `doc/recipe-format.md` |
| **テンプレSQL（Template SQL）** | `{{key}}` プレースホルダーを含むSQL本文。レシピの一部としてBacklogに保存される |
| **プレースホルダー（Placeholder）** | `{{key}}` 形式の置換対象 |
| **handler** | プレースホルダーの埋め方の種別。`agent-literal`（Agentが直接埋める）／`preprocess-csv`（Script RunnerがCSVから抽出）／`preprocess-lookup`（Script RunnerがDBからlookup） |
| **variants** | Hostが選ぶ1パラメータ（例: A/B/C）で複数のリテラルがまとめて決まる宣言 |
| **lookup宣言** | データ由来プレースホルダーの生成元を宣言的に記述したもの。方式A（構造化YAML `steps`）／方式B（ネストIN句のSQLテンプレート）の2通り |
| **steps** | lookup宣言を構成する各段の実行単位（`from`/`select`/`key`/`filters`） |
| **静的安全チェック** | 起票前にAgentが行う機械的な妥当性確認（未置換プレースホルダー無し・BEGIN/ROLLBACK枠・backup有無・空WHERE無し・日付クォート等） |

## ワークフロー・プロセス

| 用語 | 意味 |
| --- | --- |
| **recipe-ops** | `.claude/skills/recipe-ops/` のルータースキル。Hostの意図を4つに振り分ける |
| **フローA（レシピ作成）** | 新規レシピを起こす |
| **フローB（レシピ修正）** | 既存レシピを直す。軽量パス（テンプレ文言・lookup宣言の追加のみ）／重量パス（`preprocess-csv`/`preprocess-lookup`の枠を超える前処理コードが必要） |
| **フローC（チケット新規作成）** | レシピを使ってBacklogチケットを起票する |
| **フローD（チケットへSQL追記）** | 既存チケットにフォローアップSQLを追記する |
| **要件シート** | requirements-analystが作る、業務要件を構造化したドキュメント（`doc/requirements/<name>/<name>.md`） |
| **叩き台** | 設計・ドキュメントの初期ラフ版。要件の抜けを炙り出す目的で意図的に浅く作る（作り込まない） |

## フェーズ担当エージェント（`.claude/agents/`）

| エージェント | 役割 |
| --- | --- |
| **requirements-analyst** | 要件ヒアリング。実装前の要件シート作成 |
| **designer** | 処理設計。手作業SQLをテンプレ＋プレースホルダー宣言＋lookup宣言へ写像 |
| **implementer** | 前処理コード実装（必要時のみ）。まずコードを増やさない |
| **tester** | 前処理コアの単体・結合テスト |
| **documenter** | ①Agent向けレシピ ②運用ドキュメントの作成。Backlog登録 |
| **reviewer** | 最終ゲート。横断の一貫性・重複・必要十分性・データ安全性の二重チェック |

## 将来像（未着手・構想）

現地の実際の構成（IDE + `.claude/skill/` + `dev/`）に組み込む将来計画。詳細は会話ログ・今後
`doc/architecture/` に追記予定。

| 用語 | 意味 | 状態 |
| --- | --- | --- |
| **orchestration.skill** | 全体統括のみを担うスキル。現状の`recipe-ops`から分割される可能性がある | 構想 |
| **script-runner.skill** | Script Runner（このリポジトリ）を呼ぶ薄いラッパースキル | 構想 |
| **db-runner.skill** | Local DB Containerの起動・利用を担う想定のスキル | 構想 |
