export async function GET(request) {
  const urlParam = new URL(request.url).searchParams.get("url");
  if (!urlParam) return new Response("No URL provided", { status: 400 });

  try {
    const target = new URL(urlParam);

    const response = await fetch(target.href, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9"
      }
    });

    let text = await response.text();
    const workerBase = request.url.split("?")[0];

    // Rewrite resource links (img, script, css)
    text = text.replace(
      /(href|src)=["'](?!https?:|\/\/|#)([^"']+)["']/gi,
      (match, attr, path) => {
        const absolute = new URL(path, target).href;
        return `${attr}="${workerBase}?url=${encodeURIComponent(absolute)}"`;
      }
    );

    // Rewrite <a> links
    text = text.replace(
      /<a\s+[^>]*href=["']([^"']+)["']/gi,
      (match, href) => {
        let absolute = href.startsWith("http") ? href : new URL(href, target).href;
        return match.replace(href, `${workerBase}?url=${encodeURIComponent(absolute)}`);
      }
    );

    // Rewrite <form> actions
    text = text.replace(
      /<form\s+[^>]*action=["']([^"']*)["']/gi,
      (match, action) => {
        let absolute = action ? (action.startsWith("http") ? action : new URL(action, target).href) : target.href;
        return match.replace(action, `${workerBase}?url=${encodeURIComponent(absolute)}`);
      }
    );

    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "text/html; charset=UTF-8" }
    });
  } catch (err) {
    return new Response("Fetch failed: " + err.message, { status: 500 });
  }
}
