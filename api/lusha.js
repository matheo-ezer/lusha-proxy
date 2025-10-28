export default async function handler(req, res) {
    // --- Auth simple par secret ---
    const clientSecret = req.headers['x-proxy-secret'];
    if (!process.env.PROXY_SECRET || clientSecret !== process.env.PROXY_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
  
    // --- 1) Healthcheck sans réseau : doit toujours marcher ---
    if (req.url.startsWith('/health')) {
      return res.status(200).json({ ok: true, env: {
        hasSecret: !!process.env.PROXY_SECRET,
        hasApiKey: !!process.env.LUSHA_API_KEY
      }});
    }
  
    // --- 2) Debug réseau simple : appelle ipify pour tester la sortie HTTP ---
    if (req.url.startsWith('/debug')) {
      try {
        const r = await fetch('https://api.ipify.org?format=json'); // fetch natif Node 20
        const ip = await r.json();
        return res.status(200).json({ ok: true, ip });
      } catch (e) {
        return res.status(500).json({ ok: false, error: String(e) });
      }
    }
  
    // --- 3) Proxy vers Lusha ---
    const targetUrl = 'https://api.lusha.com' + req.url;
  
    try {
      const lushaResp = await fetch(targetUrl, {
        method: req.method,
        headers: {
          'api_key': process.env.LUSHA_API_KEY,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: req.method === 'GET' ? undefined : JSON.stringify(req.body || {})
      });
  
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
      return res.status(500).json({ error: String(err?.message || 'Proxy error') });
    }
  }
  