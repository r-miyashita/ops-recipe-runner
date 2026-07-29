import "dotenv/config";
import mysql from "mysql2/promise";

/**
 * 環境変数をもとにMySQLコネクションを生成する。
 * 接続情報は `.env` ファイルの DB_HOST / DB_PORT / DB_USER / DB_PASSWORD / DB_NAME から読み込む。
 * @returns mysql2のコネクションPromise
 */
export function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}
