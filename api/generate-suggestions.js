// Yeh file Vercel par "/api/generate-suggestions" route ban jaati hai.
// Browser seedha Groq ko call nahi karta — yeh server function beech me rehta hai,
// isliye GROQ_API_KEY kabhi bhi browser ya GitHub me expose nahi hoti.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Sirf POST request allowed hai.' });
  }

  const { prompt } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt missing hai.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server par GROQ_API_KEY set nahi hai. Vercel Environment Variables check karein.' });
  }

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        // NOTE: Agar yeh model error de (deprecated ho jaaye), console.groq.com/docs/models
        // pe jaake current model list se naam update kar dena.
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok) {
      console.error('Groq API error:', data);
      return res.status(groqRes.status).json({ error: data.error?.message || 'Groq API error' });
    }

    const text = data.choices?.[0]?.message?.content || '';
    return res.status(200).json({ text });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error, baad me try karein.' });
  }
}
