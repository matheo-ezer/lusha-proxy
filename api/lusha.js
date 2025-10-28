export default async function handler(req, res) {
    const clientSecret = req.headers['x-proxy-secret'];
    if (!process.env.PROXY_SECRET || clientSecret !== process.env.PROXY_SECRET) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Debug : montrer ce qu'on reçoit
    return res.status(200).json({
        debug: true,
        url: req.url,
        method: req.method,
        fullUrl: `https://api.lusha.com${req.url}`,
        hasApiKey: !!process.env.LUSHA_API_KEY
    });
}