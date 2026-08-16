# レシピ フォーマット（正準）

> レシピは Agent が読んでチケット(SQL)を生成するための**機械可読な仕様**。
> ドキュメンターがこの形式で作成し、レビュー担当がこの形式で検証する。
> 作成フロー・静的チェックは `doc/architecture/recipe-creation.md`、パターン例は `doc/operation-pattern-example.md`。

## 位置づけ

- テンプレSQL・レシピは **Backlog が正**（移行前はファイルで暫定管理）。
- レシピは「テンプレSQLの**どのプレースホルダを、誰が、何から**埋めるか」を宣言する。
- 3パターン（リテラルのみ / +CSV / +lookup）を**同じ形式**で表す（不要な節は省略してよい）。

## フィールド仕様

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `name` | ✔ | レシピ名（定例の識別子） |
| `purpose` | ✔ | 目的（1〜2文） |
| `timing` | | 実行タイミング（月初 など） |
| `template` | ✔ | テンプレSQLの所在（Backlogドキュメント参照。暫定はファイルパス） |
| `input_csv` | | 前処理が使う入力CSV（列と意味） |
| `parameters` | | Host に確認するリテラルパラメータ（と日付の派生ルール） |
| `placeholders` | ✔ | 各 `{{key}}` の handler と値の由来 |
| `lookups` | | 宣言的 lookup（データ由来プレースホルダの生成元） |
| `safety` | ✔ | トランザクション枠・backup・ロールバック基準（実行時の静的安全チェックの期待） |

## プレースホルダの handler（種別）

| handler | 埋める人 | source の書き方 |
| --- | --- | --- |
| `agent-literal` | Agent | `param:<名>` / `fixed:<値>` / `date:<ルール>` |
| `preprocess-csv` | 前処理 | `csv:<列名>`（CSVから抽出しカンマ連結） |
| `preprocess-lookup` | 前処理 | `lookup:<名>`（下記 lookups を実行） |

## lookup 宣言

- `steps` の各段: `from` / `select` / `key` / `keySource`（`csv:<列>` or `prevStep`）/ `filters`。
- **read-only**。`key in (vals)` の値だけをパラメータ化。`from/select/key` の識別子は**実スキーマに存在**すること。
- 多段は `steps` の連鎖で表現（例: `order_id → order_detail_id → sales_id`）。
- 論理削除除外（`logical_delete_flag = 0`）の要否を `filters` に明記。

## 例（+lookup パターン: 締日・入金日の更新）

```yaml
name: updateShippingAndBillingInfo
purpose: 出荷日変更に伴い、対象受注の締日・入金日を更新する
timing: 月初
template: backlog:doc/<id>   # 暫定: doc/requirements/<name>/samples/manual.sql 由来

input_csv:
  columns:
    - order_id      # 対象受注ID（lookupの種）
    - shipping_id

parameters:
  - key: userId
    meaning: 作業者ID
    type: number
  - key: processingMonth
    meaning: 処理月（この月初を基準日にする）
    derives:
      - "newCloseDate = 翌月初日"
      - "newDepositDate = 新締日から14営業日後の翌営業日（入金猶予日も同日）"

placeholders:
  - { key: userId,         handler: agent-literal,     source: "param:userId" }
  - { key: newCloseDate,   handler: agent-literal,     source: "date:翌月初日" }
  - { key: newDepositDate, handler: agent-literal,     source: "date:新締日+14営業日の翌営業日" }
  - { key: invoiceIds,     handler: preprocess-lookup, source: "lookup:invoiceIds" }

lookups:
  - name: invoiceIds
    steps:
      - from: t_order
        select: invoice_id
        key: order_id
        keySource: csv:order_id
        filters: ["logical_delete_flag = 0"]

safety:
  transaction: true            # BEGIN; ... ROLLBACK|COMMIT
  backup: true                 # 更新前に backup select
  rollback_check: "checkが0件でなければ ROLLBACK"
```

### パターン別の省略
- **リテラルのみ**: `input_csv` / `lookups` を省略。`placeholders` はすべて `agent-literal`。
- **+CSV**: `lookups` を省略。データ由来は `preprocess-csv`（例 `orderIds`）。
- **+lookup**: 上記フル形。

## 静的チェックとの対応（`recipe-creation.md`）

| チェック項目 | レシピ上の根拠 |
| --- | --- |
| プレースホルダ種別が設計と一致 | `placeholders[].handler` / `source` |
| lookup識別子が実スキーマに存在 | `lookups[].steps[].from/select/key` |
| 未置換 `{{...}}` が残らない | テンプレの全 `{{key}}` が `placeholders` に定義されている |
| 実行時の静的安全チェックを通せる枠 | `safety`（transaction / backup / rollback_check） |
