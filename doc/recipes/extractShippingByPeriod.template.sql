/***
* データ抽出
* ---
* 指定期間に出荷されたデータを抽出する（read-only）
* ---
* - 抽出期間: shipment_date が fromDate〜toDate
*/
set @fromDate = '{{fromDate}}';
set @toDate = '{{toDate}}';

select
  *
from
  t_shipping
where
  shipment_date between @fromDate and @toDate;
