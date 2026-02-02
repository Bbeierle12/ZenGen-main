import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Loader } from './Loader';

describe('Loader', () => {
  it('should render the provided text', () => {
    render(<Loader text="Loading..." />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should render different text props', () => {
    render(<Loader text="Generating your meditation..." />);

    expect(screen.getByText('Generating your meditation...')).toBeInTheDocument();
  });

  it('should render empty text', () => {
    render(<Loader text="" />);

    const paragraph = document.querySelector('p');
    expect(paragraph).toBeInTheDocument();
    expect(paragraph?.textContent).toBe('');
  });

  it('should render with fade-in animation class', () => {
    const { container } = render(<Loader text="Test" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('animate-fade-in');
  });

  it('should render a spinner element', () => {
    const { container } = render(<Loader text="Test" />);

    const spinnerContainer = container.querySelector('.relative');
    expect(spinnerContainer).toBeInTheDocument();
  });

  it('should have spinning animation on spinner', () => {
    const { container } = render(<Loader text="Test" />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should render text with pulse animation', () => {
    const { container } = render(<Loader text="Test" />);

    const text = container.querySelector('p');
    expect(text).toHaveClass('animate-pulse');
  });

  it('should use teal color theme', () => {
    const { container } = render(<Loader text="Test" />);

    const text = container.querySelector('p');
    expect(text).toHaveClass('text-teal-200');
  });

  it('should be centered with flex layout', () => {
    const { container } = render(<Loader text="Test" />);

    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('flex', 'flex-col', 'items-center', 'justify-center');
  });

  it('should handle long text', () => {
    const longText = 'This is a very long loading message that should still render correctly in the loader component';
    render(<Loader text={longText} />);

    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('should handle special characters in text', () => {
    render(<Loader text="Loading... ✨🧘‍♀️" />);

    expect(screen.getByText('Loading... ✨🧘‍♀️')).toBeInTheDocument();
  });
});
