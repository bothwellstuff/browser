import fs from "fs";
import path from "path";
import config from "../config.json" assert { type: "json" };
import ProxyLib from "../lib/index.js"; // make sure lib/index.js supports ESM

const proxy = new ProxyLib(config.prefix, {
  localAddress: config.localAddresses ?? false,
  blacklist: config.blockedHostnames ?? false
});

const indexFile = "index.html";
const atob = str => Buffer.from(str, "base64").toString("utf-8");

export async function GET(request) {
  try {
    const urlObj = new URL(request.url);
    const params = urlObj.searchParams;
    const pathname = urlObj.pathname;

    // Handle proxied HTTP request
    const proxUrl = params.get("url");
    if (proxUrl && (pathname === "/prox" || pathname === "/prox/" || pathname === "/session" || pathname === "/session/")) {
      let target = atob(proxUrl);
      if (!target.startsWith("http")) target = "http://" + target;
      const redirect = config.prefix + proxy.proxifyRequestURL(target);
      return new Response("", { status: 301, headers: { location: redirect } });
    }

    // Serve local files (from /public)
    const publicPath = path.join(process.cwd(), "public", pathname);
    if (fs.existsSync(publicPath)) {
      const stats = fs.lstatSync(publicPath);
      if (stats.isDirectory()) {
        const indexPath = path.join(publicPath, indexFile);
        if (fs.existsSync(indexPath)) {
          return new Response(fs.readFileSync(indexPath, "utf-8"), { headers: { "Content-Type": "text/html" } });
        }
      } else if (stats.isFile()) {
        return new Response(fs.readFileSync(publicPath, "utf-8"), { headers: { "Content-Type": "text/html" } });
      }
    }

    return new Response(`Cannot GET ${pathname}`, { status: 404 });
  } catch (err) {
    return new Response("Error: " + err.message, { status: 500 });
  }
}
