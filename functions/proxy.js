const { createProxyMiddleware } = require('http-proxy-middleware');

exports.handler = async function(event, context) {
    const urlParam = event.queryStringParameters?.url;
    if (!urlParam) return { statusCode: 400, body: 'No URL provided' };

    try {
        const targetUrl = new URL(urlParam);

        // Fetch the target page
        const res = await fetch(targetUrl.href);
        let text = await res.text();

        // Rewrite relative links to pass through this proxy
        text = text.replace(
            /(href|src)=["'](?!https?:|\/\/|#)([^"']+)["']/gi,
            (match, attr, path) => {
                const absolute = new URL(path, targetUrl).href;
                return `${attr}="/.netlify/functions/proxy?url=${encodeURIComponent(absolute)}"`;
            }
        );

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: text
        };
    } catch (err) {
        return { statusCode: 500, body: 'Fetch failed: ' + err.message };
    }
};
