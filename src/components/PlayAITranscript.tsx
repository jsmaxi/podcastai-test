"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";

interface TranscriptItem {
  speaker: string;
  text: string;
}

interface PlayAITranscriptProps {
  transcript: TranscriptItem[];
  voiceProfiles: Record<string, string>; // Map of speaker names to PlayAI voice IDs
}

const PlayAITranscript: React.FC<PlayAITranscriptProps> = ({
  transcript,
  voiceProfiles,
}) => {
  const [audioUrls, setAudioUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [audioElements, setAudioElements] = useState<HTMLAudioElement[]>([]);

  useEffect(() => {
    if (transcript?.length > 0) {
      generateAudio();
    }
  }, [transcript]);

  const generateAudio = async () => {
    setIsLoading(true);

    try {
      // Format the entire transcript as a single text with speaker prefixes
      const formattedText = transcript
        .map((item) => `${item.speaker}: ${item.text}`)
        .join("\n\n");

      // Get voice mappings for the API call
      const speakers = [...new Set(transcript.map((item) => item.speaker))];
      const primarySpeaker = speakers[0] || "";
      const secondarySpeaker = speakers[1] || "";

      // Call the API with the complete transcript
      const response = await axios.post("/api/speech", {
        text: formattedText,
        primarySpeaker,
        secondarySpeaker,
      });

      // Set the single audio URL
      const audioUrl = response.data.audioUrl;
      setAudioUrls([audioUrl]);

      // Create a single audio element
      const audio = new Audio(audioUrl);
      setAudioElements([audio]);
    } catch (error) {
      console.error("Error generating audio:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const playSequentially = () => {
    if (audioElements.length === 0) return;

    setCurrentIndex(0);
    playCurrentAudio(0);
  };

  const playCurrentAudio = (index: number) => {
    if (index >= audioElements.length) {
      setCurrentIndex(-1);
      return;
    }

    const audio = audioElements[index];
    audio.onended = () => playCurrentAudio(index + 1);
    audio.play();
    setCurrentIndex(index);
  };

  return (
    <div className="p-4 border rounded">
      <h2 className="text-xl font-bold mb-4">Generated Conversation</h2>

      {isLoading ? (
        <p>Generating audio...</p>
      ) : (
        <>
          {audioUrls.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Audio Playback</h3>
              <audio src={audioUrls[0]} controls className="w-full" />
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Transcript</h3>
            {transcript.map((item, index) => (
              <div key={index} className="p-3 rounded bg-gray-100">
                <p className="font-bold">{item.speaker}:</p>
                <p>{item.text}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default PlayAITranscript;
