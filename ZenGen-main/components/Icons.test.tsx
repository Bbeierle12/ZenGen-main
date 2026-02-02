import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  IconSparkles,
  IconPlay,
  IconPause,
  IconChat,
  IconClose,
  IconRefresh,
  IconUser,
  IconHistory,
  IconSettings,
} from './Icons';

describe('Icons', () => {
  describe('IconSparkles', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconSparkles />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconSparkles className="w-5 h-5 text-teal-400" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5', 'text-teal-400');
    });

    it('should have stroke-based paths', () => {
      const { container } = render(<IconSparkles />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('stroke', 'currentColor');
    });
  });

  describe('IconPlay', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconPlay />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconPlay className="w-8 h-8" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-8', 'h-8');
    });
  });

  describe('IconPause', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconPause />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconPause className="text-white" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-white');
    });
  });

  describe('IconChat', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconChat />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconChat className="w-6 h-6" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6');
    });
  });

  describe('IconClose', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconClose />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconClose className="w-4 h-4" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-4', 'h-4');
    });
  });

  describe('IconRefresh', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconRefresh />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconRefresh className="animate-spin" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('animate-spin');
    });
  });

  describe('IconUser', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconUser />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconUser className="w-5 h-5" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-5', 'h-5');
    });
  });

  describe('IconHistory', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconHistory />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconHistory className="text-slate-400" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('text-slate-400');
    });
  });

  describe('IconSettings', () => {
    it('should render an SVG element', () => {
      const { container } = render(<IconSettings />);
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(<IconSettings className="w-6 h-6 text-gray-500" />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveClass('w-6', 'h-6', 'text-gray-500');
    });
  });

  describe('All Icons', () => {
    const icons = [
      { Component: IconSparkles, name: 'IconSparkles' },
      { Component: IconPlay, name: 'IconPlay' },
      { Component: IconPause, name: 'IconPause' },
      { Component: IconChat, name: 'IconChat' },
      { Component: IconClose, name: 'IconClose' },
      { Component: IconRefresh, name: 'IconRefresh' },
      { Component: IconUser, name: 'IconUser' },
      { Component: IconHistory, name: 'IconHistory' },
      { Component: IconSettings, name: 'IconSettings' },
    ];

    it.each(icons)('$name should have fill="none" attribute', ({ Component }) => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('fill', 'none');
    });

    it.each(icons)('$name should have viewBox attribute', ({ Component }) => {
      const { container } = render(<Component />);
      const svg = container.querySelector('svg');
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24');
    });

    it.each(icons)('$name should have path element', ({ Component }) => {
      const { container } = render(<Component />);
      const path = container.querySelector('path');
      expect(path).toBeInTheDocument();
    });
  });
});
