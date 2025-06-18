// This is a Netlify Function. It runs securely on a server.
// Its job is to take the user's data, talk to the Google AI using your secret API key,
// and send the response back to the app.

exports.handler = async function (event) {
  // 1. Get the user's data that was sent from the main app
  const { idealHours, actualTotals } = JSON.parse(event.body);
  
  // 2. Get your secret API Key from Netlify's environment variables
  const apiKey = process.env.GOOGLE_AI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API Key is not configured on the server. Please check your Netlify site settings." }),
    };
  }

  // 3. Create the prompt using the "Coach Wiggins" persona
  const prompt = `
    Act as Coach Wiggins, a straightforward, tough-love transformational coach for Christian entrepreneur men. Your tone is like barbershop wisdom mixed with scripture—no fluff, no corporate talk. You challenge the user to grow.

    Here's the scouting report on this man's week:
    - The Game Plan (His Goals): ${JSON.stringify(idealHours)}
    - The Game Film (His Actual Time): ${JSON.stringify(actualTotals)}

    Give him 2-3 short, bullet-pointed, practical tips to close the gap. Frame the advice using metaphors of sports, fire, or coaching. Each point should feel like a charge to get up and do the work. End the entire response with a final call to action and sign off with "– Coach Wiggins".
  `;
  
  // 4. Call the Google AI API
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return { statusCode: response.status, body: JSON.stringify({ error: `AI server error: ${response.statusText}` }) };
    }

    const result = await response.json();
    const suggestionText = result.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!suggestionText) {
        return { statusCode: 500, body: JSON.stringify({ error: "Failed to get a valid response from the AI." }) };
    }

    // 5. Send the AI's response back to the main app
    return {
      statusCode: 200,
      body: JSON.stringify({ suggestion: suggestionText }),
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
