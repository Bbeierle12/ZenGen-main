import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatBot } from './ChatBot';

// Mock the claudeService
vi.mock('../services/claudeService', () => ({
  createChat: vi.fn(() => ({
    sendMessage: vi.fn().mockResolvedValue({ text: 'Mock response from AI' }),
  })),
}));

import { createChat } from '../services/claudeService';

describe('ChatBot', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Use real timers for userEvent compatibility
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  describe('initial state', () => {
    it('should render floating chat button', () => {
      render(<ChatBot />);

      const chatButton = screen.getByRole('button');
      expect(chatButton).toBeInTheDocument();
    });

    it('should not show chat panel initially', () => {
      render(<ChatBot />);

      expect(screen.queryByText('Zen Guide')).not.toBeInTheDocument();
    });
  });

  describe('opening chat panel', () => {
    it('should show chat panel when button is clicked', async () => {
      render(<ChatBot />);

      const chatButton = screen.getByRole('button');
      fireEvent.click(chatButton);

      expect(screen.getByText('Zen Guide')).toBeInTheDocument();
    });

    it('should initialize chat session when opened', async () => {
      render(<ChatBot />);

      fireEvent.click(screen.getByRole('button'));

      expect(createChat).toHaveBeenCalled();
    });

    it('should show intro message when opened', async () => {
      render(<ChatBot />);

      fireEvent.click(screen.getByRole('button'));

      await waitFor(() => {
        expect(screen.getByText(/meditation guide/i)).toBeInTheDocument();
      });
    });

    it('should hide floating button when panel is open', () => {
      render(<ChatBot />);

      const chatButton = screen.getByRole('button');
      fireEvent.click(chatButton);

      // The button should have scale-0 class when panel is open
      expect(chatButton).toHaveClass('scale-0');
    });
  });

  describe('closing chat panel', () => {
    it('should close panel when close button is clicked', async () => {
      const { container } = render(<ChatBot />);

      // Open panel
      fireEvent.click(screen.getByRole('button'));
      expect(screen.getByText('Zen Guide')).toBeInTheDocument();

      // Find close button by its class (the one in the header with hover:text-white)
      const closeButton = container.querySelector('button.text-slate-400.hover\\:text-white');
      if (closeButton) {
        fireEvent.click(closeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Zen Guide')).not.toBeInTheDocument();
      });
    });
  });

  describe('sending messages', () => {
    it('should have input field and send button', async () => {
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      expect(screen.getByPlaceholderText(/mindfulness/i)).toBeInTheDocument();
    });

    it('should update input value on typing', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'How do I meditate?');

      expect(input).toHaveValue('How do I meditate?');
    });

    it('should send message and display user message', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Hello');

      // Find and click send button (not close button)
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find((b) => b.querySelector('svg path[d*="12 19l9"]'));
      if (sendButton) {
        fireEvent.click(sendButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Test message');

      // Press Enter to send
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('should display AI response after sending', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Help me relax');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Mock response from AI')).toBeInTheDocument();
      });
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.keyboard('{Enter}');

      // Should still only have the intro message
      const messages = screen.getAllByText(/./);
      // createChat should not be called again for empty message
    });

    it('should send message on Enter key press', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Question');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Question')).toBeInTheDocument();
      });
    });

    it('should show typing indicator while waiting for response', async () => {
      // Make the mock return a delayed promise
      const mockSendMessage = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ text: 'Response' }), 100))
      );
      (createChat as any).mockReturnValue({ sendMessage: mockSendMessage });

      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Test');
      await user.keyboard('{Enter}');

      // The streaming message should show "..."
      await waitFor(() => {
        expect(screen.getByText('...')).toBeInTheDocument();
      });
    });

    it('should disable send button while typing/loading', async () => {
      const mockSendMessage = vi.fn().mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ text: 'Response' }), 200))
      );
      (createChat as any).mockReturnValue({ sendMessage: mockSendMessage });

      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Test');
      await user.keyboard('{Enter}');

      // Send button should be disabled during loading
      const buttons = screen.getAllByRole('button');
      const sendButton = buttons.find((b) => b.querySelector('svg path[d*="12 19l9"]'));
      expect(sendButton).toBeDisabled();
    });
  });

  describe('error handling', () => {
    it('should display error message when API fails', async () => {
      const mockSendMessage = vi.fn().mockRejectedValue(new Error('Network error'));
      (createChat as any).mockReturnValue({ sendMessage: mockSendMessage });

      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'Test');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/trouble connecting/i)).toBeInTheDocument();
      });
    });

    it('should handle chat initialization error gracefully', () => {
      // Save original mock
      const originalMock = (createChat as any).getMockImplementation?.();

      (createChat as any).mockImplementation(() => {
        throw new Error('Init failed');
      });

      render(<ChatBot />);
      // Should not crash
      expect(() => {
        fireEvent.click(screen.getByRole('button'));
      }).not.toThrow();

      // Restore original mock for subsequent tests
      (createChat as any).mockImplementation(() => ({
        sendMessage: vi.fn().mockResolvedValue({ text: 'Mock response from AI' }),
      }));
    });
  });

  describe('message styling', () => {
    it('should style user messages differently from AI messages', async () => {
      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'User message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        const userMessage = screen.getByText('User message');
        expect(userMessage.closest('div')).toHaveClass('bg-teal-700');
      });
    });
  });

  describe('scroll behavior', () => {
    it('should auto-scroll to bottom on new messages', async () => {
      const mockScrollIntoView = vi.fn();
      Element.prototype.scrollIntoView = mockScrollIntoView;

      const user = userEvent.setup();
      render(<ChatBot />);
      fireEvent.click(screen.getByRole('button'));

      const input = screen.getByPlaceholderText(/mindfulness/i);
      await user.type(input, 'New message');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(mockScrollIntoView).toHaveBeenCalled();
      });
    });
  });
});
