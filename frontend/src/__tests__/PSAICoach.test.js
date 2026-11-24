import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PSAICoach from '../components/PSAICoach';

describe('PSAICoach Component', () => {
  const mockUser = {
    username: 'Alex',
    fitness_goal: 'Hypertrophy'
  };

  const mockProps = {
    token: 'test-token',
    API_URL: 'http://localhost:8000',
    user: mockUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url, options) => {
      if (url.includes('/chat/history')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (url.includes('/chat')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            response: "To maximize progressive overload on your bench press, increase weight by 2.5kg once you hit 3 sets of 10 with RPE < 8."
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders coach greeting and input field', async () => {
    render(<PSAICoach {...mockProps} />);
    
    expect(screen.getByPlaceholderText(/Message PS AI Coach/i)).toBeInTheDocument();
  });

  test('sends a user message and renders the assistant response', async () => {
    render(<PSAICoach {...mockProps} />);

    const input = screen.getByPlaceholderText(/Message PS AI Coach/i);
    fireEvent.change(input, { target: { value: 'How should I progress my bench press?' } });

    fireEvent.keyPress(input, { key: 'Enter', code: 13, charCode: 13 });

    // Verify user message appears
    expect(screen.getByText('How should I progress my bench press?')).toBeInTheDocument();

    // Verify coach reply appears
    await waitFor(() => {
      expect(screen.getByText(/maximize progressive overload on your bench press/i)).toBeInTheDocument();
    });
  });
});
