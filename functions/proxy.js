const fetch = require('node-fetch');

exports.handler = async function(event) {
  const urlParam = event.queryStringParameters?.url;
  if (!urlParam) return { statusCode: 400, body: 'No URL provided' };

  try {
    const target = new URL(urlParam);

    const response = await fetch(target.href, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html"
      }
    });

    let text = await response.text();
    const baseUrl = '/.netlify/functions/proxy';

    // Rewrite href/src links
    text = text.replace(/(href|src)=["'](?!https?:|\/\/|#)([^"']+)["']/gi,
      (match, attr, path) => `${attr}="${baseUrl}?url=${encodeURIComponent(new URL(path, target).href)}"`);

    // Rewrite <a> links
    text = text.replace(/<a\s+[^>]*href=["']([^"']+)["']/gi,
      (match, href) => match.replace(href, `${baseUrl}?url=${encodeURIComponent(new URL(href, target).href)}`));

    return {
      statusCode: response.status,
      headers: { "Content-Type": "text/html; charset=UTF-8" },
      body: text
    };
  } catch (err) {
    return { statusCode: 500, body: 'Fetch failed: ' + err.message };
  }
};
