import http from "node:http";
import fs from "node:fs";
import crypto from "node:crypto";

const USERS = "/tmp/hive-dast-users.json";
const sessions = new Set();
const users = () => {
  try { return JSON.parse(fs.readFileSync(USERS, "utf8")); } catch { return {}; }
};
const cookieOf = (req) => /(?:^|; )sid=([^;]+)/.exec(req.headers.cookie ?? "")?.[1];
const bearerOf = (req) => /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
const signedIn = (req) => sessions.has(cookieOf(req)) || sessions.has(bearerOf(req));
// Only signed-in responses omit this header, so a ZAP finding for it proves a session worked.
const safe = { "X-Content-Type-Options": "nosniff" };
const page = (links) => links.map((l) => `<a href="${l}">${l}</a>`).join(" ");

http.createServer((req, res) => {
  const path = req.url.split("?")[0];
  if (req.method === "POST" && path === "/api/login") {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      let input = {};
      try {
        input = (req.headers["content-type"] ?? "").includes("json")
          ? JSON.parse(body)
          : Object.fromEntries(new URLSearchParams(body));
      } catch {}
      if (!input.email || users()[input.email] !== input.password) {
        res.writeHead(401, safe);
        return res.end("wrong login");
      }
      const id = crypto.randomBytes(24).toString("hex");
      sessions.add(id);
      res.writeHead(200, {
        ...safe,
        "Content-Type": "application/json",
        "Set-Cookie": `sid=${id}; Path=/; HttpOnly`,
      });
      res.end(JSON.stringify({ accessToken: id }));
    });
    return;
  }
  // A scanner probing paths would otherwise end its own session, so logout needs a POST.
  if (path === "/logout" && req.method !== "POST") {
    res.writeHead(405, safe);
    return res.end("use POST");
  }
  if (path === "/logout") {
    sessions.delete(cookieOf(req));
    sessions.delete(bearerOf(req));
    res.writeHead(200, safe);
    return res.end("logged out");
  }
  if (path === "/api" || path.startsWith("/api/")) {
    if (!signedIn(req)) {
      res.writeHead(401, safe);
      return res.end("login required");
    }
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end(page(["/api/me", "/api/items", "/api/secret-area", "/api-internal/report", "/logout"]));
  }
  if (path.startsWith("/api-internal")) {
    res.writeHead(200, { "Content-Type": "text/html" });
    return res.end("internal page without the safe header");
  }
  res.writeHead(200, { ...safe, "Content-Type": "text/html" });
  res.end(`<h1>Public page</h1>${page(["/api", "/api/me", "/api/items", "/api-internal/report"])}`);
}).listen(3000, "127.0.0.1");
