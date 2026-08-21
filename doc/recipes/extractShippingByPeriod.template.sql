/***
* データ抽出
* ---
* 指定期間・出荷ステータスで出荷データを抽出する（read-only）
* ---
* - 抽出期間: shipment_date が fromDate〜toDate
* - 出荷ステータス: shippingStatus と一致するもの
*/
set @fromDate = '{{fromDate}}';
set @toDate = '{{toDate}}';
set @shippingStatus = {{shippingStatus}};

select
  *
from
  t_shipping
where
  shipment_date between @fromDate and @toDate
  and shipping_status = @shippingStatus;
