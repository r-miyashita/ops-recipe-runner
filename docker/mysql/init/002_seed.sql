INSERT INTO `t_order` (`order_id`, `invoice_id`, `logical_delete_flag`) VALUES
  (10001, 30001, 0),
  (10002, 30002, 0),
  (10003, 30003, 0),
  (10004, 30004, 0),
  (10005, 30005, 0);

INSERT INTO `t_order_detail` (`order_detail_id`, `order_id`, `product_id`, `product_name`, `quantity`, `unit_price`, `logical_delete_flag`, `update_user_id`, `update_datetime`) VALUES
  (40001, 10001, 50001, 'Product A', 2, 1000, 0, 1018, NOW()),
  (40002, 10002, 50002, 'Product B', 1, 2500, 0, 1018, NOW()),
  (40003, 10003, 50003, 'Product C', 3, 800, 0, 1018, NOW()),
  (40004, 10004, 50001, 'Product A', 5, 1000, 0, 1018, NOW()),
  (40005, 10005, 50004, 'Product D', 1, 12000, 0, 1018, NOW());

INSERT INTO `t_sales` (`sales_id`, `order_detail_id`, `product_id`, `product_name`, `quantity`, `total_amount`, `sales_office_id`, `logical_delete_flag`, `update_user_id`, `update_datetime`) VALUES
  (60001, 40001, 50001, 'Product A', 2, 2000, 5, 0, 1018, NOW()),
  (60002, 40002, 50002, 'Product B', 1, 2500, 3, 0, 1018, NOW()),
  (60003, 40003, 50003, 'Product C', 3, 2400, 2, 0, 1018, NOW()),
  (60004, 40004, 50001, 'Product A', 5, 5000, 5, 0, 1018, NOW()),
  (60005, 40005, 50004, 'Product D', 1, 12000, 3, 0, 1018, NOW());

INSERT INTO `t_shipping` (`shipping_id`, `order_id`, `shipment_date`, `shipping_status`, `user_id`, `logical_delete_flag`, `update_datetime`) VALUES
  (20001, 10001, '2026-06-10', 2, 1018, 0, NOW()),
  (20002, 10002, '2026-06-10', 2, 1018, 0, NOW()),
  (20003, 10003, '2026-06-11', 1, 1018, 0, NOW()),
  (20004, 10004, '2026-06-11', 1, 1018, 0, NOW()),
  (20005, 10005, '2026-06-12', 2, 1018, 0, NOW());

INSERT INTO `t_billing_info` (`invoice_id`, `close_date`, `deposit_date`, `deposit_grace_date`, `logical_delete_flag`, `update_user_id`, `update_datetime`) VALUES
  (30001, '2026-06-30', '2026-07-15', '2026-07-29', 0, 1018, NOW()),
  (30002, '2026-06-30', '2026-07-15', '2026-07-29', 0, 1018, NOW()),
  (30003, '2026-06-30', '2026-07-15', '2026-07-29', 0, 1018, NOW()),
  (30004, '2026-06-30', '2026-07-15', '2026-07-29', 0, 1018, NOW()),
  (30005, '2026-06-30', '2026-07-15', '2026-07-29', 0, 1018, NOW());
