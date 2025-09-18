// functions/proxy.js
import fetch from 'node-fetch';

export async function handler(event, context) {
  const urlParam = event.queryStringParameters.url;
  if (!urlParam) return { statusCode: 400, body: "No URL provided" };

  try {
    const response = await fetch(urlParam, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const text = await response.text();
    return {
      statusCode: 200,
      headers: { "Content-Type": "text/html" },
      body: text,
    };
  } catch (err) {
    return { statusCode: 500, body: `Fetch failed: ${err.message}` };
  }
}
