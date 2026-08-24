# レシピ フォーマット（正準）

> レシピは Agent が読んでチケット(SQL)を生成するための**機械可読な仕様**。
> ドキュメンターがこの形式で作成し、レビュー担当がこの形式で検証する。
> 作成フロー・静的チェックは `doc/architecture/recipe-creation.md`、パターン例は `doc/operation-pattern-example.md`。

## 位置づけ

- テンプレSQL・レシピは **Backlog が正**。この repo（Script Runner）にはテンプレSQLを持たない。
- レシピは「テンプレSQLの**どのプレースホルダを、誰が、何から**埋めるか」を宣言する。
- 3パターン（リテラルのみ / +CSV / +lookup）を**同じ形式**で表す（不要な節は省略してよい）。

## フィールド仕様

| フィールド | 必須 | 内容 |
| --- | --- | --- |
| `name` | ✔ | レシピ名（定例の識別子） |
| `purpose` | ✔ | 目的（1〜2文） |
| `timing` | | 実行タイミング（月初 など） |
| `template` | ✔ | テンプレSQLの所在（`backlog:doc/<id>` 形式でBacklogドキュメントを参照） |
| `input_csv` | | 前処理が使う入力CSV（列と意味） |
| `parameters` | | Host に確認するリテラルパラメータ（と日付の派生ルール） |
| `variants` | | Host が選ぶ1パラメータに複数リテラルが連動するバリエーション定義 |
| `placeholders` | ✔ | 各 `{{key}}` の handler と値の由来 |
| `lookups` | | 宣言的 lookup（データ由来プレースホルダの生成元） |
| `safety` | ✔ | トランザクション枠・backup・ロールバック基準（実行時の静的安全チェックの期待） |

## プレースホルダの handler（種別）

| handler | 埋める人 | source の書き方 |
| --- | --- | --- |
| `agent-literal` | Agent | `param:<名>` / `fixed:<値>` / `date:<ルール>` / `variant:<key>`（下記 variants を参照） |
| `preprocess-csv` | 前処理 | `csv:<列名>`（CSVから抽出しカンマ連結） |
| `preprocess-lookup` | 前処理 | `lookup:<名>`（下記 lookups を実行） |

## variants 宣言（バリエーション選択）

Host が1つのパラメータ（例: `variation: A/B/C`）を選ぶと、複数のリテラルがまとめて決まるケースに使う。

```yaml
variants:
  key: variation          # Host が選ぶパラメータ名
  options:
    A: { salesUserId: 101, salesUserName: teamA, salesOfficeId: 5 }
    B: { salesUserId: 201, salesUserName: teamB, salesOfficeId: 3 }
    C: { salesUserId: 301, salesUserName: teamC, salesOfficeId: 2 }
```

- `variants.key` は `parameters` にも列挙する（型は `enum(<選択肢>)`）。
- `placeholders` からは `source: "variant:<option内のキー名>"` で参照する（例 `variant:salesUserId`）。
- Host が未選択の間は Agent が選択肢を提示して確認する（勝手に既定値を選ばない）。

## lookup 宣言

lookupは**2つの書き方**を許可する。どちらも最終的に Runner が受け取る同じJSON契約（`steps`配列）に
収束するため、Runner側の実装や安全チェックはどちらの書き方でも変わらない。

### 方式A: 構造化YAML（`steps`）

- 各段: `from` / `select` / `key` / `keySource`（`csv:<列>` or `prevStep`）/ `filters`。
- 多段は `steps` の連鎖で表現（例: `order_id → order_detail_id → sales_id`）。
- 複雑な形（JOIN・UNION・計算式など）が必要な場合は、現状この方式のみで表現できる可能性がある
  （方式Bは下記の制約付きテンプレートのみ対応）。将来 Runner 側の変換器が対応形式を増やすまでは、
  方式Aの範囲でも表現できない形は**レシピを作らない**（要件を見直す）。

### 方式B: SQLテンプレート（初期バージョンはこの形のみ対応）

**単一テーブル・ネストIN句チェーン**という決まった形のSQLで書ける。Agentがこの形を読み、
ネストの各階層を1ステップとして方式Aと同じJSONに変換してからRunnerへ渡す。

```sql
/***
* Lookup用テンプレート
* ---
* 単一テーブル・ネストIN句チェーンのみ対応（初期バージョン）
* 各階層が1ステップに変換される。最内層の in (...) の元はCSV由来の値。
* ---
*/
select
  <select>
from
  <from>
where
  <key> in (
    select
      <subSelect>
    from
      <subFrom>
    where
      <subKey> in (<csvValues>)
  );
```

プレースホルダ名は方式Aの `steps` フィールド名（`from`/`select`/`key`）にそのまま対応する
（内側の階層は `sub` を付けて区別）。これによりAgentの変換はほぼ機械的な写し替えになる。

- ネストは何段でもよい（各階層が1ステップになる）。3段以上になる場合は `<subFrom>` の
  サブクエリの中にさらに同じ形（`select <subSubSelect> from <subSubFrom> where ...`）を入れ子にする。
- **各階層は単一テーブル・単一カラムのSELECTのみ**。JOIN・UNION・サブクエリ以外の入れ子・
  計算式・複数カラムSELECTは**この形式では非対応**（初期バージョンのガード対象）。
  対応形式外のSQLが渡された場合、Agentは変換せずレシピを差し戻す（方式Aへの書き換えを提案）。
- 例: 多段lookup（受注ID→order_detail_id→sales_id）は
  外側=`{from: t_sales, select: sales_id, key: order_detail_id, keySource: prevStep}`、
  内側=`{from: t_order_detail, select: order_detail_id, key: order_id, keySource: csv:...}`
  に変換される（`<subFrom>`=t_order_detail, `<subSelect>`=order_detail_id, `<subKey>`=order_id,
  `<from>`=t_sales, `<select>`=sales_id, `<key>`=order_detail_id）。

### 共通ルール

- **read-only**。`key in (vals)` の値だけをパラメータ化。`from/select/key` の識別子は
  **実スキーマに存在**すること（Runnerが`information_schema`で検証してから埋め込む）。
- `filters` は `列名 = リテラル` の厳格な形式のみ許可（自由記述のSQL断片は不可）。
  列名は同テーブルのallowlistで検証する。
- 論理削除除外（`logical_delete_flag = 0`）の要否を `filters` に明記。

## 例（+lookup パターン: 締日・入金日の更新）

```yaml
name: updateShippingAndBillingInfo
purpose: 出荷日変更に伴い、対象受注の締日・入金日を更新する
timing: 月初
template: backlog:doc/<id>   # 元は doc/requirements/<name>/samples/manual.sql の手作業SQL

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
- **リテラルのみ**: `input_csv` / `variants` / `lookups` を省略。`placeholders` はすべて `agent-literal`。
- **+CSV**: `lookups` を省略。データ由来は `preprocess-csv`（例 `orderIds`）。`variants` は必要なら併用可
  （例: バリエーション選択のリテラル＋CSV由来IDの更新）。
- **+lookup**: 上記フル形。

## 静的チェックとの対応（`recipe-creation.md`）

| チェック項目 | レシピ上の根拠 |
| --- | --- |
| プレースホルダ種別が設計と一致 | `placeholders[].handler` / `source` |
| `variant:` 参照が options に実在 | `placeholders[].source` ↔ `variants.options[*]` のキー |
| lookup識別子が実スキーマに存在 | `lookups[].steps[].from/select/key` |
| 未置換 `{{...}}` が残らない | テンプレの全 `{{key}}` が `placeholders` に定義されている |
| 実行時の静的安全チェックを通せる枠 | `safety`（transaction / backup / rollback_check） |
