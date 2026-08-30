# テストサマリー

このプロジェクトで「動作確認済み」と言える範囲を、コードテストとシナリオ検証の2軸でまとめる。
テスト方針・粒度の考え方は `doc/testing-policy.md` を参照。

## 単体テスト（`npm test`）

対象は前処理コアの純粋ロジック。DB不要、CI常時実行。現在21件、すべてパス。

| 対象 | ファイル | 確認内容 |
| --- | --- | --- |
| CSV解析・抽出 | `src/lib/csv.test.ts` | `parseCsv`（正常系／データ0件のエラー）、`extractColumn`（列抽出／存在しない列のエラー）、`parseCsvFilter`（「列名 = 値」の解析／不正形式の拒否）、`filterRows`（行フィルタ／存在しない列のエラー） |
| lookup組み立て | `src/lib/lookup.test.ts` | `isValidIdentifier`（識別子の許可・拒否）、`parseFilter`（「列名 = リテラル」の解析／自由記述SQLの拒否） |

## 結合テスト（`npm run test:integration`）

対象はDBを挟む lookup 実行（`runLookupSteps`）。`docker compose up -d db`（seed投入済み）が前提。現在5件、すべてパス。

| 確認内容 |
| --- |
| 単段lookup（受注ID→請求書ID） |
| 多段lookup（受注ID→order_detail_id→売上ID） |
| 存在しないテーブルを指定した場合のエラー |
| 存在しない列を指定した場合のエラー |
| 入力IDが0件のときDBに問い合わせず空を返す |

## シナリオ検証（ops-recipe-runnerのフロー、Backlog連携込み）

コードテストの範囲外（生成SQLの忠実性・レシピ登録からチケット起票までの一連の流れ）は、
Backlog連携を使ったシナリオ検証で確認している。

| フロー | 確認範囲 |
| --- | --- |
| A（レシピ作成） | リテラルのみ／+CSV／+lookupの3パターンで、レシピ登録から静的安全チェックまで |
| B（レシピ修正・軽量パス） | テンプレ文言・lookup宣言の追加のみで完結する修正 |
| B（レシピ修正・重量パス） | 既存の宣言的機構（`preprocess-csv`/`preprocess-lookup`）の枠を超える前処理が必要なケースで、新規コード追加からBacklogへの反映まで |
| C（チケット新規作成） | レシピ取得→パラメータ確認→前処理→SQL組み立て→静的安全チェック→起票 |
| D（チケットへSQL追記） | 既存チケットへのフォローアップSQL追記 |

## コードテストの対象外（Agentの確認観点で担保）

| 項目 | 担保する場所 |
| --- | --- |
| 生成SQLの忠実性（受入） | `doc/architecture/ticket-workflow.md` の静的安全チェック（§4） |
| 日付計算（多TZ・祝日繰上） | 同 §5 |
