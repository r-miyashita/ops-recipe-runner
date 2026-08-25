# dump 置き場

本番相当データをローカルDBへ復元するための `mysqldump` ファイルの固定置き場。

## 使い方（自動復元・推奨）

`latest.sql` という名前で置くと、**初回コンテナ作成時（ボリュームが空の時）に自動で復元**される。
置かなければ、既定のスキーマ/seed（`docker/mysql/init/default/`）が代わりに適用される。

```bash
cp <取得したdump>.sql docker/mysql/dump/latest.sql
docker compose up -d db
```

既に初期化済みのボリュームに後から差し替えたい場合は、一度作り直してから起動する。

```bash
docker compose down -v
docker compose up -d db
```

## 使い方（手動復元）

起動中のDBに、`latest.sql` 以外の dump を都度流し込みたい場合はこちら。

```bash
docker compose up -d db
# healthcheck完了を待ってから
docker compose exec -T db mysql -uroot -proot sandbox < docker/mysql/dump/<file>.sql
```

## スキーマ空ダンプ（要件ヒアリング用）

テーブル定義だけを渡したい場合は、データ無しの空ダンプを `schema.sql` として置く。
データを含まないため機微情報の混入リスクがなく、実DBのテーブル定義を安全に共有できる。

```bash
mysqldump --no-data -u<user> -p <db> > docker/mysql/dump/schema.sql
```

## 注意

- 復元は既存データを上書きする破壊的操作。実行前に対象DBを確認すること。
- 自動復元（`latest.sql`）は `docker/mysql/init/000_bootstrap.sh` が判定している。既定のスキーマ/seedは
  `docker/mysql/init/default/` に移設済み（`docker-entrypoint-initdb.d` 直下ではなく、
  bootstrapスクリプトからのみ実行される）。
- このディレクトリの `*.sql` は Git 管理外（本ファイルのみ追跡）。
