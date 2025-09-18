import { readFileSync, lstatSync, createReadStream, existsSync } from "fs";
import path from "path";
import ProxyLib from "../lib/index.js";
import config from "../config.json" assert { type: "json" };
a
const proxy = new ProxyLib(config.prefix, {
  localAddress: config.localAddresses ?? false,
  blacklist: config.blockedHostnames ?? false
});

const index_file = "index.html";
const atob = (str) => Buffer.from(str, "base64").toString("utf-8");

export async function GET(req) {
  const { searchParams, pathname } = new URL(req.url);

  // HTTP(S) proxy
  if (req.url.startsWith(config.prefix)) {
    // Vercel serverless can't directly access raw sockets, so WebSockets won't work
    return new Response("WebSocket proxy not supported in Vercel", { status: 501 });
  }

  const urlParam = searchParams.get("url");
  const pathNameClean = pathname.split("#")[0];

  if (urlParam && ["/prox", "/prox/", "/session", "/session/"].includes(pathNameClean)) {
    let url = atob(urlParam);
    if (!url.startsWith("http")) url = url.startsWith("//") ? "http:" + url : "http://" + url;
    return Response.redirect(config.prefix + proxy.proxifyRequestURL(url), 301);
  }

  // Serve static files from /public
  const publicPath = path.join(process.cwd(), "public", pathNameClean);

  try {
    const stats = lstatSync(publicPath);
    if (stats.isDirectory()) {
      const indexPath = path.join(publicPath, index_file);
      if (existsSync(indexPath)) return new Response(createReadStream(indexPath));
      else return new Response("404 Not Found", { status: 404 });
    } else if (stats.isFile()) {
      return new Response(createReadStream(publicPath));
    }
  } catch (err) {
    return new Response("404 Not Found", { status: 404 });
  }

  return new Response("404 Not Found", { status: 404 });
}
