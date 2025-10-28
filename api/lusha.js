import fetch from 'node-fetch';

export default async function handler(req, res) {
  const clientSecret = req.headers['x-proxy-secret'];
  if (!process.env.PROXY_SECRET || clientSecret !== process.env.PROXY_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const targetUrl = 'https://api.lusha.com' + req.url;

  try {
    console.log('[lusha-proxy] Fetching:', targetUrl);

    const lushaResp = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'api_key': process.env.LUSHA_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {})
    });

    console.log('[lusha-proxy] Status:', lushaResp.status);

    const contentType = lushaResp.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const data = await lushaResp.json();
      return res.status(lushaResp.status).json(data);
    } else {
      const text = await lushaResp.text();
      res.status(lushaResp.status).setHeader('Content-Type', contentType || 'text/plain');
      return res.send(text);
    }
  } catch (err) {
    console.error('[lusha-proxy] Error:', err?.stack || err?.message || err);
    return res.status(500).json({ error: String(err?.message || err || 'Proxy error') });
  }
}