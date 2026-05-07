const Anthropic = require('@anthropic-ai/sdk');
exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
  try {
    const { messages, useSearch } = JSON.parse(event.body);
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const params = { model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages };
    if (useSearch) params.tools = [{ type: 'web_search_20250305', name: 'web_search' }];
    const response = await client.messages.create(params);
    const text = response.content.filter(c => c.type === 'text').map(c => c.text).join('');
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ text })
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
