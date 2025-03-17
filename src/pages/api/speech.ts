import axios from "axios";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }
  
    try {
      const { text, primarySpeaker, secondarySpeaker } = req.body;
  
      if (!text) {
        return res.status(400).json({ error: 'Missing required parameters' });
      }

      const apiKey = process.env.PLAY_SECRET_KEY;
      const userId = process.env.PLAY_USER_ID;
    
      if (!apiKey || !userId) {
        console.log("API secret or User ID not configured!");
        return res.status(500).json({ message: 'API secret or User ID not configured!' });
      }

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
          voice: "s3://voice-cloning-zero-shot/65977f5e-a22a-4b36-861b-ecede19bdd65/original/manifest.json", // Voice for first speaker
          voice2: "s3://voice-cloning-zero-shot/831bd330-85c6-4333-b2b4-10c476ea3491/original/manifest.json", // Voice for second speaker
          turnPrefix: `${primarySpeaker}:`, // Prefix for first speaker's lines
          turnPrefix2: `${secondarySpeaker}:`, // Prefix for second speaker's lines
          outputFormat: 'mp3',
          speed: 1.0,
          Language: 'english',
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
    } catch (error) {
      console.error('Error generating speech:', error);
      return res.status(500).json({ error: 'Failed to generate speech' });
    }
  }