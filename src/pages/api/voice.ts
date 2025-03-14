import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { text, voice, outputFormat, speed, language } = req.body;

  if (!text || !voice || !outputFormat) {
    console.log("Missing required fields: text, voice, or outputFormat");
    return res.status(400).json({ message: 'Missing required fields: text, voice, or outputFormat' });
  }

  const apiKey = process.env.PLAY_SECRET_KEY;
  const userId = process.env.PLAY_USER_ID;

  if (!apiKey || !userId) {
    console.log("API secret or User ID not configured!");
    return res.status(500).json({ message: 'API secret or User ID not configured!' });
  }

  try {
    // Submit the TTS job
    const submitResponse = await fetch('https://api.play.ai/api/v1/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'X-USER-ID': userId,
      },
      body: JSON.stringify({
        model: 'PlayDialog',
        text,
        voice,
        outputFormat,
        speed: speed || 1.0,
        language: language || 'english',
      }),
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json();
      console.log("Error data:", errorData);
      return res.status(submitResponse.status).json({ message: 'Failed to submit TTS job', error: errorData });
    }

    const { id: jobId } = await submitResponse.json();

    // Poll for job status
    let audioUrl: string | null = null;
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 5 minutes (30 attempts * 10 seconds)

    while (attempts < maxAttempts) {
      console.log("Polling API...");
      const statusResponse = await fetch(`https://api.play.ai/api/v1/tts/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-USER-ID': userId,
        },
      });

      if (!statusResponse.ok) {
        const errorData = await statusResponse.json();
        console.log("Failed to check job status");
        return res.status(statusResponse.status).json({ message: 'Failed to check job status', error: errorData });
      }

      const { output } = await statusResponse.json();

      if (output.status === 'COMPLETED') {
        audioUrl = output.url;
        break;
      } else if (output.status === 'IN_PROGRESS') {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds before polling again
      } else {
        console.log("Job failed or encountered an unknown status");
        return res.status(500).json({ message: 'Job failed or encountered an unknown status', status: output.status });
      }
    }

    if (!audioUrl) {
      console.log("Job did not complete within the expected time");
      return res.status(500).json({ message: 'Job did not complete within the expected time' });
    }

    // Return the audio URL
    return res.status(200).json({ audioUrl });
  } catch (error: any) {
    console.log('Error in TTS API:', error);
    return res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
}