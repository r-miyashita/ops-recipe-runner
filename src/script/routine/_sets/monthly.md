# monthly セット

月初に実行する定例ルーティンのセット。「monthlyセットで実行して」で run-routine スキルから参照される。

## 対象ルーティン（実行順）

1. updateShipmentDate
2. updateSalesInfo

## 備考

- 実行前に各ルーティンの `data/in.csv` と `docker/mysql/dump/` の dump を配置しておくこと。
- パラメータは実行時に確認する（`--userId` は当月のオペレーター、`--variation`・`--baseDate` は対象内容に応じて指定）。
