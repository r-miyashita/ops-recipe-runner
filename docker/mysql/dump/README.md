# dump 置き場

本番相当データをローカルDBへ復元するための `mysqldump` ファイルの固定置き場。

## 使い方

1. dump ファイル（`.sql`）をこのディレクトリに配置する。
2. DBを起動して復元する。

```bash
docker compose up -d db
# healthcheck完了を待ってから
docker compose exec -T db mysql -uroot -proot sandbox < docker/mysql/dump/<file>.sql
```

## 注意

- 復元は既存データを上書きする破壊的操作。実行前に対象DBを確認すること。
- `docker/mysql/init/` は初回コンテナ作成時のみ実行されるスキーマ/seed。dump 復元とは別物。
