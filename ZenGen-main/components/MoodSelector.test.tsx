import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoodSelector, MoodSelectorInline, MoodDisplay, getMoodInfo } from './MoodSelector';
import { MoodLevel } from '../types';

describe('MoodSelector', () => {
  const defaultProps = {
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render 5 mood buttons', () => {
      render(<MoodSelector {...defaultProps} />);

      expect(screen.getByTitle('Very Low')).toBeInTheDocument();
      expect(screen.getByTitle('Low')).toBeInTheDocument();
      expect(screen.getByTitle('Neutral')).toBeInTheDocument();
      expect(screen.getByTitle('Good')).toBeInTheDocument();
      expect(screen.getByTitle('Excellent')).toBeInTheDocument();
    });

    it('should render label when provided', () => {
      render(<MoodSelector {...defaultProps} label="How are you feeling?" />);

      expect(screen.getByText('How are you feeling?')).toBeInTheDocument();
    });

    it('should show selected mood label when value is set', () => {
      render(<MoodSelector {...defaultProps} value={MoodLevel.GOOD} />);

      expect(screen.getByText('Good')).toBeInTheDocument();
    });

    it('should not show selected label when no value', () => {
      render(<MoodSelector {...defaultProps} />);

      expect(screen.queryByText('Good')).not.toBeInTheDocument();
      expect(screen.queryByText('Neutral')).not.toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('should call onChange when mood button is clicked', () => {
      render(<MoodSelector {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Excellent'));

      expect(defaultProps.onChange).toHaveBeenCalledWith(MoodLevel.EXCELLENT);
    });

    it('should call onChange with correct mood level', () => {
      render(<MoodSelector {...defaultProps} />);

      fireEvent.click(screen.getByTitle('Very Low'));
      expect(defaultProps.onChange).toHaveBeenCalledWith(MoodLevel.VERY_LOW);

      fireEvent.click(screen.getByTitle('Neutral'));
      expect(defaultProps.onChange).toHaveBeenCalledWith(MoodLevel.NEUTRAL);
    });

    it('should not call onChange when disabled', () => {
      render(<MoodSelector {...defaultProps} disabled />);

      fireEvent.click(screen.getByTitle('Good'));

      expect(defaultProps.onChange).not.toHaveBeenCalled();
    });
  });

  describe('sizes', () => {
    it('should render with small size', () => {
      const { container } = render(<MoodSelector {...defaultProps} size="sm" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('w-8');
      expect(button).toHaveClass('h-8');
    });

    it('should render with medium size by default', () => {
      const { container } = render(<MoodSelector {...defaultProps} />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('w-12');
      expect(button).toHaveClass('h-12');
    });

    it('should render with large size', () => {
      const { container } = render(<MoodSelector {...defaultProps} size="lg" />);

      const button = container.querySelector('button');
      expect(button).toHaveClass('w-16');
      expect(button).toHaveClass('h-16');
    });
  });

  describe('selected state', () => {
    it('should highlight selected mood', () => {
      render(<MoodSelector {...defaultProps} value={MoodLevel.GOOD} />);

      const goodButton = screen.getByTitle('Good');
      expect(goodButton).toHaveClass('scale-110');
      expect(goodButton).toHaveClass('ring-2');
    });

    it('should not highlight unselected moods', () => {
      render(<MoodSelector {...defaultProps} value={MoodLevel.GOOD} />);

      const neutralButton = screen.getByTitle('Neutral');
      expect(neutralButton).not.toHaveClass('scale-110');
      expect(neutralButton).not.toHaveClass('ring-2');
    });
  });
});

describe('MoodSelectorInline', () => {
  const defaultProps = {
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render 5 mood buttons', () => {
    render(<MoodSelectorInline {...defaultProps} />);

    expect(screen.getByTitle('Very Low')).toBeInTheDocument();
    expect(screen.getByTitle('Excellent')).toBeInTheDocument();
  });

  it('should render label when provided', () => {
    render(<MoodSelectorInline {...defaultProps} label="Before" />);

    expect(screen.getByText('Before')).toBeInTheDocument();
  });

  it('should call onChange when clicked', () => {
    render(<MoodSelectorInline {...defaultProps} />);

    fireEvent.click(screen.getByTitle('Good'));

    expect(defaultProps.onChange).toHaveBeenCalledWith(MoodLevel.GOOD);
  });
});

describe('MoodDisplay', () => {
  it('should render mood emoji', () => {
    render(<MoodDisplay mood={MoodLevel.EXCELLENT} />);

    expect(screen.getByRole('img', { name: 'Excellent' })).toBeInTheDocument();
  });

  it('should render with different sizes', () => {
    const { container, rerender } = render(<MoodDisplay mood={MoodLevel.GOOD} size="sm" />);
    expect(container.firstChild).toHaveClass('w-6');

    rerender(<MoodDisplay mood={MoodLevel.GOOD} size="md" />);
    expect(container.firstChild).toHaveClass('w-8');

    rerender(<MoodDisplay mood={MoodLevel.GOOD} size="lg" />);
    expect(container.firstChild).toHaveClass('w-10');
  });

  it('should have correct title', () => {
    render(<MoodDisplay mood={MoodLevel.NEUTRAL} />);

    expect(screen.getByTitle('Neutral')).toBeInTheDocument();
  });
});

describe('getMoodInfo', () => {
  it('should return mood info for valid mood level', () => {
    const info = getMoodInfo(MoodLevel.EXCELLENT);

    expect(info).toBeDefined();
    expect(info?.label).toBe('Excellent');
    expect(info?.emoji).toBe('😊');
  });

  it('should return undefined for invalid mood level', () => {
    const info = getMoodInfo(99 as MoodLevel);

    expect(info).toBeUndefined();
  });
});
