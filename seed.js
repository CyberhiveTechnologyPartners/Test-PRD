import fs from "node:fs";

const USERS = "/tmp/hive-dast-users.json";
let users = {};
try { users = JSON.parse(fs.readFileSync(USERS, "utf8")); } catch {}
users[process.env.HIVE_DAST_USERNAME] = process.env.HIVE_DAST_PASSWORD;
fs.writeFileSync(USERS, JSON.stringify(users), { mode: 0o600 });
