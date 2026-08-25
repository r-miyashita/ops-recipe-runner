#!/bin/bash
# 初回コンテナ作成時（ボリュームが空の時）のみ実行される。
# dump/latest.sql があればそれを復元し、無ければ既定のスキーマ/seedを適用する。
set -e

DUMP_FILE="/docker-entrypoint-initdb.d/dump/latest.sql"
DEFAULT_DIR="/docker-entrypoint-initdb.d/default"

if [ -f "$DUMP_FILE" ]; then
  echo "[bootstrap] dump を検出しました。復元します: $DUMP_FILE"
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$DUMP_FILE"
else
  echo "[bootstrap] dump が未配置のため、既定のスキーマ/seedを適用します"
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$DEFAULT_DIR/001_schema.sql"
  mysql -uroot -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE" < "$DEFAULT_DIR/002_seed.sql"
fi
