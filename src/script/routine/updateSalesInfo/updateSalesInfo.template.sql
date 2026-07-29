/***
* csvから受注ID取得
* 受注IDからsales_id取得(lookup select)
* updateのバリエーションがある
*
*/

/***
* 共通設定
* ---
* @userId: オペレーション担当
* @updateDatetime: システム日付
*/
set @userId = {{userId}};
set @updateDatetime = now();



/***
* 受注データ変更
* ---
* 対象受注の更新
* ---
* - 更新キー: CSVから取得した受注ID
*     - ids: {{orderIds}}
* - 更新情報:
*     - 担当情報:
*       - sales_user_id
*       - sales_user_name
*       - sales_office_id
* - 更新バリエーション: 
*     - A
*       - sales_user_id: 101
*       - sales_user_name: teamA
*       - sales_office_id: 5
*     - B
*       - sales_user_id: 201
*       - sales_user_name: teamB
*       - sales_office_id: 3
*     - C
*       - sales_user_id: 301
*       - sales_user_name: teamC
*       - sales_office_id: 2
*
*/

set @salesUserId = {{salesUserId}};
set @salesUserName = '{{salesUserName}}';
set @salesOfficeId = {{salesOfficeId}};

/***
* backup
*/
select * from t_order
where order_id in ({{orderIds}});


/***
* update 
*/
BEGIN;
-- -

UPDATE `t_order`
SET
  `sales_user_id` = @salesUserId,
  `sales_user_name` = @salesUserName,
  `sales_office_id` = @salesOfficeId,
  `update_datetime` = @updateDatetime,
  `update_user_id` = @userId
WHERE
  `order_id` IN ({{orderIds}});


/***
* check
* ---
* 期待値: 0件。そうでない場合はROLLBACK or COMMIT + 追加対応
*/
select
  count(1) `cnt`,
  group_concat(order_id separator ',') `order_ids`
from
  t_order
where
  `sales_user_id` <> @salesUserId
  or `sales_user_name` <> @salesUserName
  or `sales_office_id` <> @salesOfficeId;

-- -
-- ROLLBACK;
-- COMMIT;


/***
* 売上データ変更
* ---
* 対象売上の更新
* ---
* - 更新キー: 受注IDキーで取得した売上ID
*     - ids: {{salesIds}}
* - 更新情報:
*     - 担当情報:
*       - sales_office_id
* - 更新バリエーション: 
*     - A
*       - sales_office_id: 5
*     - B
*       - sales_office_id: 3
*     - C
*       - sales_office_id: 2
*
*/

/***
* backup
*/
select * from t_sales
where sales_id in ({{salesIds}});


/***
* update 
*/
BEGIN;
-- -
update `t_sales`
set
  `sales_office_id` = @salesOfficeId,
  `update_datetime` = @updateDatetime,
  `update_user_id` = @userId
where
  `sales_id` in ({{salesIds}});


/***
* check
* ---
* 期待値: 0件。そうでない場合はROLLBACK or COMMIT + 追加対応
*/
select
  count(1) `cnt`,
  group_concat(sales_id separator ',') `sales_ids`
from
  t_sales
where
  `sales_office_id` <> @salesOfficeId;

-- -
-- ROLLBACK;
-- COMMIT;

