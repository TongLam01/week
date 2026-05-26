const API_KEY = process.env.METASO_API_KEY;

module.exports = async (req, res) => {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  try {
    // Vercel 会自动解析 JSON body，这里重新序列化转发给秘塔
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

    const response = await fetch('https://metaso.cn/api/open/search/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: body
    });

    const contentType = response.headers.get('content-type') || 'application/json';
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': contentType
    };
    if (contentType.includes('event-stream') || contentType.includes('text/plain')) {
      headers['Cache-Control'] = 'no-cache';
      headers['Connection'] = 'keep-alive';
    }
    res.writeHead(response.status, headers);

    // 流式透传
    const reader = response.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } catch (err) {
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: err.message }));
  }
};
