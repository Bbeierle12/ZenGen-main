import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  checkAndRequestApiKey,
  generateMeditationScript,
  generateMeditationAudio,
  speakText,
  stopSpeech,
  pauseSpeech,
  resumeSpeech,
  isSpeaking,
  createChat,
} from './claudeService';
import { createMockMeditationConfig } from '../test/fixtures/testData';
import { VoiceName } from '../types';

// Mock Anthropic API response helpers
const DEFAULT_SCRIPT_RESPONSE = `Welcome to this meditation session.

Take a deep breath in...

And slowly release...

Allow your body to relax as we begin this journey together.`;

function createMockAnthropicResponse(content: string = DEFAULT_SCRIPT_RESPONSE) {
  return {
    ok: true,
    json: vi.fn(async () => ({
      content: [{
        type: 'text',
        text: content,
      }],
      model: 'claude-haiku-4-5-20250101',
      stop_reason: 'end_turn',
      usage: {
        input_tokens: 100,
        output_tokens: 200,
      },
    })),
  };
}

function createMockAnthropicError(message: string = 'API Error', status: number = 500) {
  return {
    ok: false,
    status,
    json: vi.fn(async () => ({
      error: {
        type: 'api_error',
        message,
      },
    })),
  };
}

function setupAnthropicFetchMock(options: {
  scriptResponse?: string;
  chatResponse?: string;
  shouldError?: boolean;
  errorMessage?: string;
} = {}) {
  const {
    scriptResponse = DEFAULT_SCRIPT_RESPONSE,
    chatResponse = 'I am here to guide your meditation practice.',
    shouldError = false,
    errorMessage = 'API Error',
  } = options;

  return vi.fn(async (url: string, init?: RequestInit) => {
    if (shouldError) {
      return createMockAnthropicError(errorMessage);
    }

    // Parse the request to determine if it's a chat or script generation
    if (init?.body) {
      const body = JSON.parse(init.body as string);
      const isChat = body.messages?.length > 1;
      return createMockAnthropicResponse(isChat ? chatResponse : scriptResponse);
    }

    return createMockAnthropicResponse(scriptResponse);
  });
}

describe('claudeService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('checkAndRequestApiKey', () => {
    it('should return true when valid API key exists', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-valid-key-12345678901234567890');

      const result = await checkAndRequestApiKey();

      expect(result).toBe(true);
    });

    it('should return false when API key is missing', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');

      const result = await checkAndRequestApiKey();

      expect(result).toBe(false);
    });

    it('should return false when API key is too short', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-short');

      const result = await checkAndRequestApiKey();

      expect(result).toBe(false);
    });

    it('should return false when API key is a placeholder', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'your_api_key_here');

      const result = await checkAndRequestApiKey();

      expect(result).toBe(false);
    });

    it('should return false when API key does not start with sk-', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'invalid-key-format-12345678901234567890');

      const result = await checkAndRequestApiKey();

      expect(result).toBe(false);
    });
  });

  describe('generateMeditationScript', () => {
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key-12345678901234567890');
    });

    it('should call Anthropic API with correct parameters', async () => {
      const mockFetch = setupAnthropicFetchMock();
      global.fetch = mockFetch;

      const config = createMockMeditationConfig({ topic: 'Stress Relief' });
      await generateMeditationScript(config);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.anthropic.com/v1/messages',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'sk-ant-test-key-12345678901234567890',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });

    it('should include topic in the prompt', async () => {
      const mockFetch = setupAnthropicFetchMock();
      global.fetch = mockFetch;

      const config = createMockMeditationConfig({ topic: 'Ocean Waves' });
      await generateMeditationScript(config);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain('Ocean Waves');
    });

    it('should include technique in the prompt', async () => {
      const mockFetch = setupAnthropicFetchMock();
      global.fetch = mockFetch;

      const config = createMockMeditationConfig();
      await generateMeditationScript(config);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain(config.technique);
    });

    it('should include duration in the prompt', async () => {
      const mockFetch = setupAnthropicFetchMock();
      global.fetch = mockFetch;

      const config = createMockMeditationConfig({ durationMinutes: 10 });
      await generateMeditationScript(config);

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.messages[0].content).toContain('10 minutes');
    });

    it('should return script text on success', async () => {
      const mockFetch = setupAnthropicFetchMock({ scriptResponse: 'Test meditation script' });
      global.fetch = mockFetch;

      const config = createMockMeditationConfig();
      const result = await generateMeditationScript(config);

      expect(result).toBe('Test meditation script');
    });

    it('should throw error when API call fails', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockAnthropicError('Rate limit exceeded', 429));

      const config = createMockMeditationConfig();

      await expect(generateMeditationScript(config)).rejects.toThrow('Rate limit exceeded');
    });

    it('should throw error when API key is missing', async () => {
      vi.stubEnv('ANTHROPIC_API_KEY', '');

      const config = createMockMeditationConfig();

      await expect(generateMeditationScript(config)).rejects.toThrow('API Key not found');
    });
  });

  describe('generateMeditationAudio', () => {
    it('should return null (Web Speech API fallback)', async () => {
      const result = await generateMeditationAudio('Test text', VoiceName.Kore);

      expect(result).toBeNull();
    });

    it('should handle different voice names', async () => {
      const voices = [VoiceName.Kore, VoiceName.Puck, VoiceName.Charon, VoiceName.Fenrir, VoiceName.Zephyr];

      for (const voice of voices) {
        const result = await generateMeditationAudio('Test', voice);
        expect(result).toBeNull();
      }
    });
  });

  describe('speakText', () => {
    beforeEach(() => {
      // Reset speechSynthesis mock
      (window.speechSynthesis as any).speaking = false;
      vi.clearAllMocks();
    });

    it('should call speechSynthesis.speak with utterance', () => {
      speakText('Hello world', VoiceName.Kore);

      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should clean pause markers from text', () => {
      speakText('Test [PAUSE 5s] text [PAUSE 10s] here', VoiceName.Kore);

      const SpeechUtterance = (window as any).SpeechSynthesisUtterance;
      const utteranceArg = SpeechUtterance.mock.calls[0][0];

      // Should replace [PAUSE ...] with ...
      expect(utteranceArg).not.toContain('[PAUSE');
    });

    it('should apply voice configuration for Kore', () => {
      speakText('Test', VoiceName.Kore);

      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should call onEnd callback when speech ends', () => {
      const onEnd = vi.fn();

      speakText('Test', VoiceName.Kore, onEnd);

      // Get the utterance and trigger onend
      const SpeechUtterance = (window as any).SpeechSynthesisUtterance;
      const utterance = SpeechUtterance.mock.results[0].value;
      utterance.onend();

      expect(onEnd).toHaveBeenCalled();
    });

    it('should cancel previous speech before starting new', () => {
      speakText('First', VoiceName.Kore);
      speakText('Second', VoiceName.Kore);

      expect(window.speechSynthesis.cancel).toHaveBeenCalledTimes(2);
    });
  });

  describe('stopSpeech', () => {
    it('should call speechSynthesis.cancel', () => {
      stopSpeech();

      expect(window.speechSynthesis.cancel).toHaveBeenCalled();
    });
  });

  describe('pauseSpeech', () => {
    it('should call speechSynthesis.pause', () => {
      pauseSpeech();

      expect(window.speechSynthesis.pause).toHaveBeenCalled();
    });
  });

  describe('resumeSpeech', () => {
    it('should call speechSynthesis.resume', () => {
      resumeSpeech();

      expect(window.speechSynthesis.resume).toHaveBeenCalled();
    });
  });

  describe('isSpeaking', () => {
    it('should return speechSynthesis.speaking state', () => {
      (window.speechSynthesis as any).speaking = true;
      expect(isSpeaking()).toBe(true);

      (window.speechSynthesis as any).speaking = false;
      expect(isSpeaking()).toBe(false);
    });
  });

  describe('createChat', () => {
    beforeEach(() => {
      vi.stubEnv('ANTHROPIC_API_KEY', 'sk-ant-test-key-12345678901234567890');
    });

    it('should return object with sendMessage method', () => {
      const chat = createChat();

      expect(chat).toHaveProperty('sendMessage');
      expect(typeof chat.sendMessage).toBe('function');
    });

    it('should send messages to Anthropic API', async () => {
      const mockFetch = setupAnthropicFetchMock({ chatResponse: 'I can help with that.' });
      global.fetch = mockFetch;

      const chat = createChat();
      const response = await chat.sendMessage('Help me relax');

      expect(mockFetch).toHaveBeenCalled();
      expect(response.text).toBeDefined();
    });

    it('should maintain conversation history', async () => {
      const mockFetch = setupAnthropicFetchMock();
      global.fetch = mockFetch;

      const chat = createChat();

      await chat.sendMessage('First message');
      await chat.sendMessage('Second message');

      // Check that the second call includes the first message in history
      const secondCallBody = JSON.parse(mockFetch.mock.calls[1][1].body);
      expect(secondCallBody.messages.length).toBeGreaterThan(1);
    });

    it('should include system prompt in requests', async () => {
      const mockFetch = setupAnthropicFetchMock();
      global.fetch = mockFetch;

      const chat = createChat();
      await chat.sendMessage('Test');

      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(callBody.system).toContain('meditation guide');
    });

    it('should throw error on API failure', async () => {
      global.fetch = vi.fn().mockResolvedValue(createMockAnthropicError('Server error', 500));

      const chat = createChat();

      await expect(chat.sendMessage('Test')).rejects.toThrow();
    });
  });
});
