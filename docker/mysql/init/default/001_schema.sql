CREATE TABLE IF NOT EXISTS `t_order` (
  `order_id`             BIGINT       NOT NULL,
  `invoice_id`           BIGINT       NOT NULL,
  `logical_delete_flag`  TINYINT      NOT NULL DEFAULT 0,
  `sales_user_id`        BIGINT,
  `sales_user_name`      VARCHAR(255),
  `sales_office_id`      BIGINT,
  `update_user_id`       BIGINT,
  `update_datetime`      DATETIME,
  PRIMARY KEY (`order_id`)
);

CREATE TABLE IF NOT EXISTS `t_order_detail` (
  `order_detail_id`      BIGINT        NOT NULL,
  `order_id`             BIGINT        NOT NULL,
  `product_id`           BIGINT        NOT NULL,
  `product_name`         VARCHAR(255)  NOT NULL,
  `quantity`             INT           NOT NULL,
  `unit_price`           INT           NOT NULL,
  `logical_delete_flag`  TINYINT       NOT NULL DEFAULT 0,
  `update_user_id`       BIGINT,
  `update_datetime`      DATETIME,
  PRIMARY KEY (`order_detail_id`)
);

CREATE TABLE IF NOT EXISTS `t_sales` (
  `sales_id`             BIGINT        NOT NULL,
  `order_detail_id`      BIGINT        NOT NULL,
  `product_id`           BIGINT        NOT NULL,
  `product_name`         VARCHAR(255)  NOT NULL,
  `quantity`             INT           NOT NULL,
  `total_amount`         INT           NOT NULL,
  `sales_office_id`      BIGINT,
  `logical_delete_flag`  TINYINT       NOT NULL DEFAULT 0,
  `update_user_id`       BIGINT,
  `update_datetime`      DATETIME,
  PRIMARY KEY (`sales_id`)
);

CREATE TABLE IF NOT EXISTS `t_shipping` (
  `shipping_id`          BIGINT       NOT NULL,
  `order_id`             BIGINT       NOT NULL,
  `shipment_date`        DATE,
  `shipping_status`      TINYINT      NOT NULL DEFAULT 1,
  `user_id`              BIGINT,
  `logical_delete_flag`  TINYINT      NOT NULL DEFAULT 0,
  `update_datetime`      DATETIME,
  PRIMARY KEY (`shipping_id`)
);

CREATE TABLE IF NOT EXISTS `t_billing_info` (
  `invoice_id`           BIGINT   NOT NULL,
  `close_date`           DATE,
  `deposit_date`         DATE,
  `deposit_grace_date`   DATE,
  `logical_delete_flag`  TINYINT  NOT NULL DEFAULT 0,
  `update_user_id`       BIGINT,
  `update_datetime`      DATETIME,
  PRIMARY KEY (`invoice_id`)
);
