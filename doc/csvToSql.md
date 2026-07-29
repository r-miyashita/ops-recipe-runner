## 見積注文変更

### 概要

当月中の見積注文を翌月末出荷にずらす

---

**target tables**

| table          | t_shipping    | t_billing_info     |
| -------------- | ------------- | ------------------ |
| keyColumn      | shipping_id   | invoice_id         |
| updateColumn-1 | shipment_date | close_date         |
| updateValue-1  | 翌月末        | 翌月1日            |
| updateColumn-2 | -             | deposit_due_date   |
| updateValue-2  | -             | 翌月15日           |
| updateColumn-3 | -             | deposit_glace_date |
| updateValue-3  | -             | 翌月15日           |

---

**csv format**

| #   | 項目   |
| --- | ------ |
| 1   | 受注ID |
| 2   | 出荷ID |

---

**query template**

update t_shipping

```sql

update `t_shipping`
set
  `shipment_date` = ${ nextMonthEnd },
  `update_user_id` = ${ userId },
  `update_date_time` = ${ now }
where
  `shipping_id` in (${ shippingIdsFromCsv });

```

get keyCollumn for t_billing_info

```sql

select
  `invoice_id`
from
  t_order
where
  order_id in (${ orderIdsFromCsv });

```

update t_billing_info

```sql
update `t_billing_info`
set
  `close_date` = ${ nextMonthStart },
  `deposit_due_date` = ${ nextMonth15th },
  `deposit_grace_date` = ${ nextMonth15th },
  `update_user_id` = ${ userId },
  `update_date_time` = ${ now }
where
  `invoice_id` in (${ invoiceIds })

```
