/***
* CSVを元にデータ更新
* ---
* 受注データ変更
* ---
* - 更新キー: CSVから取得した受注ID
*     - ids: {{orderIds}}
* - 更新情報:
*     - 担当情報:
*       - sales_user_id
*       - sales_user_name
*       - sales_office_id
*     - オペレーション担当情報
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

set @userId = {{userId}};
set @updateDatetime = now();

/***
* backup
*/
select * from t_order
where order_id in ({{orderIds}});


/***
* update
*/
-- -----
BEGIN;
-- -----

UPDATE `t_order`
SET
  `sales_user_id` = @salesUserId,
  `sales_user_name` = @salesUserName,
  `sales_office_id` = @salesOfficeId,
  `update_datetime` = @updateDatetime,
  `update_user_id` = @userId
WHERE
  `order_id` IN ({{orderIds}});

-- -----
ROLLBACK;
-- COMMIT;
-- -----


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
*/

/***
* backup
*/
select * from t_sales
where sales_id in ({{salesIds}});


/***
* update
*/
-- -----
BEGIN;
-- -----

UPDATE `t_sales`
SET
  `sales_office_id` = @salesOfficeId,
  `update_datetime` = @updateDatetime,
  `update_user_id` = @userId
WHERE
  `sales_id` IN ({{salesIds}});

-- -----
ROLLBACK;
-- COMMIT;
-- -----
