import { GoogleGenAI, Modality } from "@google/genai";
import { VoiceName, MeditationConfig } from "../types";
import { decodeBase64, decodeAudioData } from "./audioUtils";

// Default timeouts for API calls
const SCRIPT_TIMEOUT_MS = 60000; // 60 seconds for script generation
const AUDIO_TIMEOUT_MS = 120000; // 120 seconds for audio generation

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param operationName Name of the operation for error message
 */
const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string
): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(`${operationName} timed out after ${timeoutMs / 1000} seconds. Please try again.`));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timeoutId);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
};

/**
 * Helper to get authorized AI client
 * We create a new instance each time to ensure we capture the latest key if selected via UI
 */
const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please configure your API key.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Check if API key is available and request one if not.
 * Returns true only if a valid key is confirmed available.
 */
export const checkAndRequestApiKey = async (): Promise<boolean> => {
  const win = window as any;

  // AI Studio environment
  if (win.aistudio && win.aistudio.hasSelectedApiKey) {
    const hasKey = await win.aistudio.hasSelectedApiKey();

    if (!hasKey) {
      // Open key selection dialog
      await win.aistudio.openSelectKey();

      // After dialog closes, verify a key was actually selected
      // Add a small delay to allow the dialog to complete
      await new Promise(resolve => setTimeout(resolve, 500));

      const keySelectedAfterDialog = await win.aistudio.hasSelectedApiKey();
      if (!keySelectedAfterDialog) {
        // User cancelled or selection failed
        return false;
      }
    }

    return true;
  }

  // Fallback for environments without window.aistudio (local dev)
  // Check if env var exists
  return !!process.env.API_KEY;
};

/**
 * Generate a meditation script using AI
 */
export const generateMeditationScript = async (config: MeditationConfig): Promise<string> => {
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

  const generatePromise = ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
  });

  const response = await withTimeout(
    generatePromise,
    SCRIPT_TIMEOUT_MS,
    'Script generation'
  );

  const text = response.text;
  if (!text) {
    throw new Error("No script was generated. Please try again with a different topic.");
  }

  return text;
};

/**
 * Generate meditation audio from text using TTS
 * Returns an AudioBuffer that can be played directly
 */
export const generateMeditationAudio = async (text: string, voice: VoiceName): Promise<AudioBuffer> => {
  const ai = getAIClient();

  // Truncate text if too long to prevent timeouts for this demo
  const safeText = text.length > 2000 ? text.substring(0, 2000) + "..." : text;

  const generatePromise = ai.models.generateContent({
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

  const response = await withTimeout(
    generatePromise,
    AUDIO_TIMEOUT_MS,
    'Audio generation'
  );

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio was generated. Please try again.");
  }

  // Create a temporary AudioContext just for decoding
  // This context will be closed after decoding to prevent resource leaks
  const tempAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

  try {
    const audioBuffer = await decodeAudioData(
      decodeBase64(base64Audio),
      tempAudioContext,
      24000,
      1
    );

    return audioBuffer;
  } finally {
    // Always close the temporary context to prevent AudioContext leaks
    // The audioBuffer will remain valid even after the context is closed
    tempAudioContext.close().catch(() => {
      // Ignore close errors - context may already be closed
    });
  }
};

/**
 * Create a chat session for the meditation assistant
 */
export const createChat = () => {
  const ai = getAIClient();
  return ai.chats.create({
    model: 'gemini-3-pro-preview',
    config: {
      systemInstruction: "You are a wise and calming meditation guide. Help the user with mindfulness, stress relief, and understanding meditation techniques. Keep responses concise and soothing.",
    }
  });
};
