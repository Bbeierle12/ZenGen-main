import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, MeditationConfig } from "../types";
import { decodeBase64, decodeAudioData } from "./audioUtils";

// Helper to get authorized AI client
// We create a new instance each time to ensure we capture the latest key if selected via UI
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please select a key.");
  }
  return new GoogleGenAI({ apiKey });
};

export const checkAndRequestApiKey = async (): Promise<boolean> => {
  const win = window as any;
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await win.aistudio.openSelectKey();
      return true;
    }
    return true;
  }
  // Fallback for environments without window.aistudio (local dev) if env var exists
  return !!process.env.API_KEY;
};

export const generateMeditationScript = async (config: MeditationConfig) => {
  const ai = getAIClient();
  const prompt = `Write a soothing, guided meditation script about "${config.topic}".
  
  Configuration:
  - Technique: ${config.technique}
  - Guidance Level: ${config.guidanceLevel}
  - Duration: Approximately ${config.durationMinutes} minutes when read aloud.
  
  Instructions:
  - Focus on the technique "${config.technique}".
  - ${config.guidanceLevel === 'Low (Mostly Silence)' ? 'Leave plenty of space for silence. Mark long silences with [PAUSE 10s] or similar, but keep the text readable.' : ''}
  - ${config.guidanceLevel === 'High (Continuous)' ? 'Keep the guidance continuous and supportive with fewer long silences.' : 'Balance the instructions with brief moments of silence.'}
  - Format the output as plain text suitable for reading aloud by a TTS engine. 
  - Do not include scene directions like [Fade in music] or [Soft voice], only write what should be spoken, unless it is a [PAUSE] marker.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  return response.text || "Sorry, I couldn't generate a script.";
};

export const generateMeditationAudio = async (text: string, voice: VoiceName) => {
  const ai = getAIClient();
  
  // Truncate text if too long to prevent timeouts for this demo
  const safeText = text.length > 2000 ? text.substring(0, 2000) + "..." : text;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: safeText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: voice },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const audioBuffer = await decodeAudioData(
    decodeBase64(base64Audio),
    audioContext,
    24000,
    1
  );

  return audioBuffer;
};

export const createChat = () => {
  const ai = getAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a wise and calming meditation guide. Help the user with mindfulness, stress relief, and understanding meditation techniques. Keep responses concise and soothing.",
    }
  });
};
