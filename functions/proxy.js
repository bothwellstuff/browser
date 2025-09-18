// functions/proxy.js
const fetch = require("node-fetch"); // make sure node-fetch is installed

exports.handler = async function(event, context) {
    const urlParam = event.queryStringParameters?.url;
    if (!urlParam) return { statusCode: 400, body: "No URL provided" };

    try {
        const res = await fetch(urlParam);
        const text = await res.text();

        return {
            statusCode: 200,
            headers: { "Content-Type": "text/html" },
            body: text
        };
    } catch (err) {
        return { statusCode: 500, body: "Fetch failed: " + err.message };
    }
};
