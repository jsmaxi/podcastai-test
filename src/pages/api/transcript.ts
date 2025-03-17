import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { agentPersonalities, scenario } = req.body;

    if (!agentPersonalities || !scenario) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Generate transcript using OpenAI based on agent personalities
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a dialogue writer. Create a realistic conversation transcript between the following personalities. Format the transcript as a JSON array of objects, each with 'speaker' and 'text' properties."
        },
        {
          role: "user",
          content: `Create a conversation transcript between these personalities: ${JSON.stringify(agentPersonalities)}. The scenario is: ${scenario}`
        }
      ],
      response_format: { type: "json_object" }
    });

    if (!completion.choices[0].message.content)
        throw "Invalid response transcript received";

    const transcript = JSON.parse(completion.choices[0].message.content);

    // Return the generated transcript
    return res.status(200).json({ transcript });
  } catch (error) {
    console.error('Error generating transcript:', error);
    return res.status(500).json({ error: 'Failed to generate transcript' });
  }
}