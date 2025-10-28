export default async function handler(req, res) {
    // Authentification
    const clientSecret = req.headers['x-proxy-secret'];
    if (!process.env.PROXY_SECRET || clientSecret !== process.env.PROXY_SECRET) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    // Health check interne
    if (req.url === '/health') {
        return res.status(200).json({ 
            ok: true, 
            env: {
                hasSecret: !!process.env.PROXY_SECRET,
                hasApiKey: !!process.env.LUSHA_API_KEY
            }
        });
    }

    // Debug interne
    if (req.url === '/debug') {
        try {
            const r = await fetch('https://api.ipify.org?format=json');
            const ip = await r.json();
            return res.status(200).json({ ok: true, ip });
        } catch (e) {
            return res.status(500).json({ ok: false, error: String(e) });
        }
    }

    // Proxy vers Lusha
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

        const data = await lushaResp.json();
        return res.status(lushaResp.status).json(data);
    } catch (err) {
        return res.status(500).json({ error: String(err?.message || 'Proxy error') });
    }
}