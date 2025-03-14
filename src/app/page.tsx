"use client";

import { useState } from "react";

export default function handleGenerateVoice() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [text, setText] = useState<string>("");
  const [voice, setVoice] = useState<string>(
    "s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json"
  );

  const voices = [
    {
      id: "voice1",
      name: "Angelo",
      url: "s3://voice-cloning-zero-shot/baf1ef41-36b6-428c-9bdf-50ba54682bd8/original/manifest.json",
    },
    {
      id: "voice2",
      name: "Deedee",
      url: "s3://voice-cloning-zero-shot/e040bd1b-f190-4bdb-83f0-75ef85b18f84/original/manifest.json",
    },
    {
      id: "voice3",
      name: "Jennifer",
      url: "s3://voice-cloning-zero-shot/801a663f-efd0-4254-98d0-5c175514c3e8/jennifer/manifest.json",
    },
    {
      id: "voice4",
      name: "Arsenio",
      url: "s3://voice-cloning-zero-shot/65977f5e-a22a-4b36-861b-ecede19bdd65/original/manifest.json",
    },
  ];

  const handleGenerateVoice = async () => {
    try {
      if (!text || text.length > 200) {
        alert("Please enter valid text (maximum 200 characters).");
        return;
      }
      setIsLoading(true);
      setAudioUrl("");
      const response = await fetch("/api/voice", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voice,
          outputFormat: "mp3",
          speed: 1.0,
          language: "english",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to generate voice");
      }
      const { audioUrl } = await response.json();
      setAudioUrl(audioUrl);
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error generating voice:", error.message);
        alert(`Error: ${error.message}`);
      } else {
        console.error("An unknown error occurred");
        alert("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "400px",
        margin: "0 auto",
        padding: "20px",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <h1 className="font-bold">Play.ai Voice Demo</h1>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="text-input">Enter Text (max 200 characters):</label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={200}
          rows={4}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "16px",
            marginTop: "8px",
          }}
          placeholder="Type your text here..."
        />
        <small>{text.length}/200 characters</small>
      </div>

      <div style={{ marginBottom: "16px" }}>
        <label htmlFor="voice-select">Select Voice:</label>
        <select
          id="voice-select"
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          style={{
            width: "100%",
            padding: "8px",
            fontSize: "16px",
            marginTop: "8px",
          }}
        >
          {voices.map((voice) => (
            <option key={voice.id} value={voice.url}>
              {voice.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleGenerateVoice}
        disabled={isLoading || !text}
        style={{
          width: "100%",
          padding: "10px",
          fontSize: "16px",
          backgroundColor: isLoading ? "#ccc" : "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: isLoading ? "not-allowed" : "pointer",
        }}
      >
        {isLoading ? "Generating..." : "Generate Voice"}
      </button>

      {audioUrl && (
        <div style={{ marginTop: "20px" }}>
          <h3>Generated Audio:</h3>
          <audio controls style={{ width: "100%" }}>
            <source src={audioUrl} type="audio/mpeg" />
            Your browser does not support the audio element.
          </audio>
        </div>
      )}
    </div>
  );
}
