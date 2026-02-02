import { VoiceName, MeditationConfig } from "../types";

// Helper to get API key
const getApiKey = () => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found. Please add ANTHROPIC_API_KEY to your .env file.");
  }
  return apiKey;
};

export const checkAndRequestApiKey = async (): Promise<boolean> => {
  const key = process.env.ANTHROPIC_API_KEY;
  // Check if key exists and is not a placeholder
  return !!key && key.length > 20 && !key.includes('your_') && key.startsWith('sk-');
};

export const generateMeditationScript = async (config: MeditationConfig): Promise<string> => {
  const apiKey = getApiKey();
  
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
  - Write ONLY the meditation script text, no introductions or explanations.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20250101',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to generate meditation script');
  }

  const data = await response.json();
  return data.content[0]?.text || "Sorry, I couldn't generate a script.";
};

// Voice mapping for Web Speech API
const voiceMapping: Record<VoiceName, { lang: string; pitch: number; rate: number }> = {
  [VoiceName.Kore]: { lang: 'en-US', pitch: 1.0, rate: 0.85 },
  [VoiceName.Puck]: { lang: 'en-US', pitch: 0.9, rate: 0.9 },
  [VoiceName.Charon]: { lang: 'en-GB', pitch: 0.8, rate: 0.8 },
  [VoiceName.Fenrir]: { lang: 'en-US', pitch: 0.7, rate: 0.85 },
  [VoiceName.Zephyr]: { lang: 'en-US', pitch: 1.1, rate: 0.9 },
};

export const generateMeditationAudio = async (text: string, voice: VoiceName): Promise<AudioBuffer | null> => {
  // Use Web Speech API for TTS
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Text-to-speech is not supported in this browser'));
      return;
    }

    // Clean up text - remove pause markers and clean formatting
    const cleanText = text
      .replace(/\[PAUSE[^\]]*\]/gi, '...')
      .replace(/\s+/g, ' ')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voiceConfig = voiceMapping[voice];
    
    // Get available voices and select one
    const setVoice = () => {
      const voices = speechSynthesis.getVoices();
      const preferredVoice = voices.find(v => v.lang.startsWith(voiceConfig.lang)) || voices[0];
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    };

    // Voices may not be loaded immediately
    if (speechSynthesis.getVoices().length > 0) {
      setVoice();
    } else {
      speechSynthesis.onvoiceschanged = setVoice;
    }

    utterance.pitch = voiceConfig.pitch;
    utterance.rate = voiceConfig.rate;
    utterance.volume = 1.0;

    // For Web Speech API, we return null for audioBuffer
    // The SessionPlayer will need to handle speech synthesis directly
    resolve(null);
  });
};

// Store the current speech synthesis state
let currentUtterance: SpeechSynthesisUtterance | null = null;

export const speakText = (text: string, voice: VoiceName, onEnd?: () => void): void => {
  if (!('speechSynthesis' in window)) {
    console.error('Text-to-speech is not supported');
    return;
  }

  // Cancel any ongoing speech
  speechSynthesis.cancel();

  // Clean up text
  const cleanText = text
    .replace(/\[PAUSE[^\]]*\]/gi, '...')
    .replace(/\s+/g, ' ')
    .trim();

  const utterance = new SpeechSynthesisUtterance(cleanText);
  const voiceConfig = voiceMapping[voice];

  const voices = speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.lang.startsWith(voiceConfig.lang)) || voices[0];
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  utterance.pitch = voiceConfig.pitch;
  utterance.rate = voiceConfig.rate;
  utterance.volume = 1.0;

  utterance.onend = () => {
    currentUtterance = null;
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.error('Speech synthesis error:', e);
    currentUtterance = null;
  };

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
};

export const pauseSpeech = (): void => {
  speechSynthesis.pause();
};

export const resumeSpeech = (): void => {
  speechSynthesis.resume();
};

export const stopSpeech = (): void => {
  speechSynthesis.cancel();
  currentUtterance = null;
};

export const isSpeaking = (): boolean => {
  return speechSynthesis.speaking;
};

// Chat functionality
interface ChatSession {
  messages: { role: 'user' | 'assistant'; content: string }[];
}

let chatSession: ChatSession = { messages: [] };

export const createChat = () => {
  chatSession = { messages: [] };
  
  return {
    sendMessage: async (message: string) => {
      const apiKey = getApiKey();
      
      chatSession.messages.push({ role: 'user', content: message });

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20250101',
          max_tokens: 1024,
          system: "You are a wise and calming meditation guide. Help the user with mindfulness, stress relief, and understanding meditation techniques. Keep responses concise and soothing.",
          messages: chatSession.messages
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get response');
      }

      const data = await response.json();
      const assistantMessage = data.content[0]?.text || "I'm sorry, I couldn't respond.";
      
      chatSession.messages.push({ role: 'assistant', content: assistantMessage });
      
      return { text: assistantMessage };
    }
  };
};
