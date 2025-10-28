export default async function handler(req, res) {
    // Vérifie le secret
    const clientSecret = req.headers['x-proxy-secret'];
    if (!process.env.PROXY_SECRET || clientSecret !== process.env.PROXY_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  
    // Construit l'URL cible de l'API Lusha
    + const targetUrl = 'https://api.lusha.com' + req.url;
  
    try {
      const lushaResp = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'api_key': process.env.LUSHA_API_KEY, // ✅ header correct pour Lusha
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {})
      });
  
      const contentType = lushaResp.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await lushaResp.json();
        return res.status(lushaResp.status).json(data);
      } else {
        const text = await lushaResp.text();
        res.status(lushaResp.status).setHeader('Content-Type', contentType);
        return res.send(text);
      }
    } catch (err) {
      return res.status(500).json({ error: err.message || 'Proxy error' });
    }
  }
  