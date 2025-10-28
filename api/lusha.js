import fetch from 'node-fetch';

export default async function handler(req, res) {
  const clientSecret = req.headers['x-proxy-secret'];
  if (!process.env.PROXY_SECRET || clientSecret !== process.env.PROXY_SECRET) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // 🔎 DEBUG : test de connectivité sortante
  if (req.url.startsWith('/debug')) {
    try {
      const r = await fetch('https://api.ipify.org?format=json');
      const ip = await r.json();
      return res.status(200).json({
        ok: true,
        ip,
        note: '✅ Sortie HTTP depuis Vercel OK — la connexion externe fonctionne'
      });
    } catch (e) {
      return res.status(500).json({
        ok: false,
        error: String(e),
        note: '❌ Erreur réseau : la sortie HTTP depuis Vercel ne marche pas'
      });
    }
  }

  // 🔁 Requête proxy vers l’API Lusha
  const targetUrl = 'https://api.lusha.com' + req.url;

  try {
    console.log('[Lusha Proxy] Calling:', targetUrl);

    const lushaResp = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'api_key': process.env.LUSHA_API_KEY,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {})
    });

    console.log('[Lusha Proxy] Status:', lushaResp.status);

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
    console.error('[Lusha Proxy] Error:', err?.message || err);
    return res.status(500).json({
      error: String(err?.message || err || 'Proxy error'),
      note: '⚠️ Erreur interne côté proxy'
    });
  }
}
