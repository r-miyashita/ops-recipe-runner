/***
* 締日変更
* ---
* 出荷日変更した受注の請求情報を変更する
* ---
* - 更新キー: 受注IDから取得する
*     - ids: {{invoiceIds}}
* - 更新情報:
*     - 新締日: 処理月の翌月初日
*     - 新入金予定日: 新締日から2週間後の翌営業日
*     - 新入金猶予日: 新入金予定日と同日
*     - 更新ユーザID: オペレーション担当
*     - 更新日付: システム日付
*/
set @newCloseDate = '{{newCloseDate}}';
set @newDepositDate = '{{newDepositDate}}';
set @userId = {{userId}};
set @updateDatetime = now();

/***
* backup
*/
select * from t_billing_info
where invoice_id in ({{invoiceIds}});


/***
* update
*/
-- -----
BEGIN;
-- -----

update `t_billing_info`
set
  `close_date` = @newCloseDate,
  `deposit_date` = @newDepositDate,
  `deposit_grace_date` = @newDepositDate,
  `update_user_id` = @userId,
  `update_datetime` = @updateDatetime
where
  `invoice_id` in ({{invoiceIds}});

-- -----
ROLLBACK;
-- COMMIT;
-- -----
