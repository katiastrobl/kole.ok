const https = require('https');

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  try {
    const { type, query } = JSON.parse(event.body);
    const key = process.env.NEWS_API_KEY;

    if (type === 'trends') {
      const queries = [
        'marketing digital argentina',
        'inteligencia artificial',
        'salud mental redes sociales',
        'cine estreno',
        'tecnologia tendencias',
      ];
      
      const results = [];
      for (const q of queries) {
        const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=es&pageSize=2&sortBy=publishedAt&apiKey=${key}`;
        const data = await httpsGet(url);
        if (data.articles) {
          data.articles.forEach(a => {
            if (a.title && a.url && !a.title.includes('[Removed]')) {
              results.push({
                titulo: a.title,
                resumen: a.description || '',
                categoria: getCat(q),
                angulo: '',
                fuente_nombre: a.source.name,
                fuente_url: a.url
              });
            }
          });
        }
      }
      return { statusCode: 200, headers, body: JSON.stringify(results.slice(0, 8)) };
    }

    if (type === 'flash') {
      const url = `https://newsapi.org/v2/top-headlines?country=ar&pageSize=10&apiKey=${key}`;
      const data = await httpsGet(url);
      const items = (data.articles || [])
        .filter(a => a.title && !a.title.includes('[Removed]'))
        .slice(0, 6)
        .map(a => ({
          texto: a.title + (a.description ? '. ' + a.description.substring(0, 80) : ''),
          emoji: '📰',
          tipo: 'Noticia',
          fuente_nombre: a.source.name,
          fuente_url: a.url
        }));
      return { statusCode: 200, headers, body: JSON.stringify(items) };
    }

    return { statusCode: 400, headers, body: JSON.stringify({ error: 'type inválido' }) };

  } catch(e) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: e.message }) };
  }
};

function getCat(q) {
  if (q.includes('marketing')) return 'Marketing';
  if (q.includes('inteligencia')) return 'IA';
  if (q.includes('salud')) return 'Salud Mental';
  if (q.includes('cine')) return 'Cine';
  return 'Tech';
}
