function getTicketDetails(message, options) {
  if (!options.apiKey) throw Error("No API key specified.");

  const prompt = "Extract event details with startTime in ISO format.\n";
  const generationConfig = {
    temperature: 1,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 100,
    responseMimeType: "application/json",
    responseSchema: {
      type: "object",
      properties: {
        "venue": {type: "string"},
        "title": {type: "string"},
        "startTime": {type: "string"},
        "location": {type: "string"}
      },
      required: ["venue", "title", "startTime", "location"]
    }
  };
  
  const text = message.getPlainBody();
  
  return gemini(prompt + text, generationConfig, options.apiKey);
}

function gemini(prompt, generationConfig, apiKey) {
  const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent?key=" + apiKey;
  const payload = {
    "contents": [{
      "parts": [{"text": prompt}]
    }],
    "generationConfig": generationConfig
  };

  const options = {
    "method": "post",
    "contentType": "application/json",
    "payload": JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  const json = JSON.parse(response);
  return JSON.parse(json.candidates[0].content.parts[0].text);
}
