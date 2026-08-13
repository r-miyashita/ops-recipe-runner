# updateShippingAndBillingInfo

## 目的

処理月中の見積受注の出荷日を翌月末にずらし、対応する請求情報の締日・入金予定日・入金繰越日を更新するSQLを生成する。

## 実行タイミング

毎月月初。処理月の出荷日変更が必要な受注が確定したタイミングで実行する。

## 入力

| 種別          | 内容                                                          |
| ------------- | ------------------------------------------------------------- |
| `data/in.csv` | 対象受注の `order_id`・`shipping_id` 一覧                     |
| `--userId`    | オペレーターのユーザーID（例: `--userId=1018`）               |
| `--baseDate`  | 処理月の月初日・YYYY-MM-DD形式（例: `--baseDate=2026-06-01`） |

## SQLテンプレート

[updateShippingAndBillingInfo.template.sql](./updateShippingAndBillingInfo.template.sql)

<details>

```sql
/***
* 共通設定
* ---
* @baseDate: 基準日: 処理月1日: 2026-06-01
* @monthStart: 月初
* @monthEnd: 月末
* @userId: オペレーション担当
* @updateDatetime: システム日付
*/
set @baseDate = '{{baseDate}}';

set @monthStart = @baseDate;
set @monthEnd = ( SELECT LAST_DAY(@monthStart) );
set @nextMonthStart = ( SELECT DATE_ADD( @monthStart, INTERVAL 1 MONTH ) );
-- 日付設定確認
select @monthStart, @monthEnd, @nextMonthStart;

set @userId = {{userId}};
set @updateDatetime = now();



/***
* 出荷日変更
* ---
* 処理月中の見積受注の出荷日を翌月末にずらす
* ---
* - 条件:
*     - 期間: 処理月中
*     - ステータス: 1:仮保存 2:入金待ち
* - 更新キー: CSVから取得した出荷ID
*     - ids: {{shippingIds}}
* - 更新情報:
*     - 出荷日: 処理月の翌月末
*/

set @newShipmentDate = ( SELECT LAST_DAY(DATE_ADD(@monthEnd, INTERVAL 1 MONTH)) );


/***
* backup
*/
select * from t_shipping
where shipping_id in ({{shippingIds}});


/***
* update
*/
BEGIN;
-- -

UPDATE `t_shipping`
SET
  `shipment_date` = @newShipmentDate,
  `user_id` = @userId,
  `update_datetime` = @updateDatetime
WHERE
  `shipping_id` IN ({{shippingIds}});


/***
* check
* ---
* 期待値: 0件。そうでない場合はROLLBACK or COMMIT + 追加対応
*/
select
  count(1) `cnt`,
  group_concat(shipping_id separator ',') `shipping_ids`
from
  t_shipping
where
  shipment_date between @monthStart and @monthEnd
  and shipping_status in (1, 2);


-- -
-- ROLLBACK;
-- COMMIT;


/***
* 締日変更
* ---
* 出荷日変更した受注の請求情報を変更する
* ---
* - 更新キー: 受注IDから取得する
*     - ids: {{invoiceIds}}
* - 更新情報:
*     - 新締日: 処理月の翌月初日
*     - 新入金予定日: 新締日から2週間後
*     - 新入金繰越日: 新入金予定日から2週間後
*/
set @newCloseDate = @nextMonthStart;
set @newDepositDueDate = {{newDepositDueDate}};
set @newDepositGraceDate = {{newDepositGraceDate}};


update `t_billing_info`
set
  `close_date` = @newCloseDate,
  `deposit_date` = {{newDepositDueDate}},
  `deposit_grace_date` = {{newDepositGraceDate}},
  `update_user_id` = @userId,
  `update_datetime` = @updateDatetime
where
  `invoice_id` in ({{invoiceIds}});
```

</details>

## 出力

`data/out.sql` — 実行用SQL（標準出力にも表示される）

- 出荷日を処理月の翌月末に更新
- 締日を処理月の翌月初に更新
- 入金予定日を `baseDate` から14日後の翌営業日に更新
- 入金繰越日を入金予定日から14日後の翌営業日に更新

## 前提条件

- DBが起動済みであること（`docker compose up -d db`）
- `data/in.csv` に対象受注が記載済みであること

## 実行

```bash
# DB起動
docker compose up -d db

# SQL生成（ローカル実行）
npm run csv-to-sql -- --userId=1018 --baseDate=2026-06-01

# SQL生成（Docker実行）
docker compose run --rm script
```

生成されたSQLを確認し、問題なければDBに流す。
