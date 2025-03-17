"use client";

import React, { useState } from "react";
import { NextPage } from "next";
import axios from "axios";
import PlayAITranscript from "../components/PlayAITranscript";

interface AgentPersonality {
  name: string;
  description: string;
  voiceId: string;
}

interface TranscriptItem {
  speaker: string;
  text: string;
}

const TestGen: NextPage = () => {
  const [agentPersonalities, setAgentPersonalities] = useState<
    AgentPersonality[]
  >([
    {
      name: "Host 1",
      description: "Friendly and helpful customer service representative",
      voiceId:
        "s3://voice-cloning-zero-shot/65977f5e-a22a-4b36-861b-ecede19bdd65/original/manifest.json",
    },
    {
      name: "Host 2",
      description: "Confused but polite customer with a technical issue",
      voiceId:
        "s3://voice-cloning-zero-shot/831bd330-85c6-4333-b2b4-10c476ea3491/original/manifest.json",
    },
  ]);
  const [scenario, setScenario] = useState<string>(
    "A customer is calling to ask if AI will replace us soon"
  );
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleGenerateTranscript = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post("/api/transcript", {
        agentPersonalities: agentPersonalities.map((p) => ({
          name: p.name,
          description: p.description,
        })),
        scenario,
      });
      console.log(response.data.transcript, response.data);
      setTranscript(response.data.transcript.conversation);
    } catch (error) {
      console.error("Error generating transcript:", error);
      alert("Failed to generate transcript");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAgent = () => {
    setAgentPersonalities([
      ...agentPersonalities,
      {
        name: `Host ${agentPersonalities.length + 1}`,
        description: "",
        voiceId: `voice_id_${agentPersonalities.length + 1}`,
      },
    ]);
  };

  const handleUpdateAgent = (
    index: number,
    field: keyof AgentPersonality,
    value: string
  ) => {
    const updatedAgents = [...agentPersonalities];
    updatedAgents[index] = { ...updatedAgents[index], [field]: value };
    setAgentPersonalities(updatedAgents);
  };

  // Create a mapping of speakers to voice IDs for PlayAI
  const voiceProfiles = agentPersonalities.reduce((acc, agent) => {
    acc[agent.name] = agent.voiceId;
    return acc;
  }, {} as Record<string, string>);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">AI Agent Transcript Generator</h1>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Agent Personalities</h2>
        {agentPersonalities.map((agent, index) => (
          <div key={index} className="flex flex-col mb-4 p-4 border rounded">
            <div className="flex gap-4 mb-2">
              <input
                type="text"
                value={agent.name}
                onChange={(e) =>
                  handleUpdateAgent(index, "name", e.target.value)
                }
                placeholder="Agent Name"
                className="p-2 border rounded flex-1"
              />
              <input
                type="text"
                value={agent.voiceId}
                onChange={(e) =>
                  handleUpdateAgent(index, "voiceId", e.target.value)
                }
                placeholder="PlayAI Voice ID"
                className="p-2 border rounded flex-1"
              />
            </div>
            <textarea
              value={agent.description}
              onChange={(e) =>
                handleUpdateAgent(index, "description", e.target.value)
              }
              placeholder="Describe the agent's personality"
              className="p-2 border rounded w-full h-24"
            />
          </div>
        ))}
        <button
          onClick={handleAddAgent}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          Add Agent
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Scenario</h2>
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="Describe the conversation scenario"
          className="p-2 border rounded w-full h-32"
        />
      </div>

      <button
        onClick={handleGenerateTranscript}
        disabled={isLoading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-6"
      >
        {isLoading ? "Generating..." : "Generate Transcript"}
      </button>

      {transcript.length > 0 && (
        <PlayAITranscript
          transcript={transcript}
          voiceProfiles={voiceProfiles}
        />
      )}
    </div>
  );
};

export default TestGen;
