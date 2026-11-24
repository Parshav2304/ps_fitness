import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import App from '../App';

describe('App Dashboard & MacroFactor Adherence Engine', () => {
  const mockUser = {
    id: 'user-123',
    username: 'Marcus',
    weight: 80,
    height: 180,
    age: 28,
    gender: 'male',
    fitness_goal: 'Cut',
    level: 4,
    xp: 620,
    hydration_goal: 3000
  };

  const mockTodayNutrition = [
    { name: 'Oatmeal', calories: 400, protein: 20, carbs: 60, fats: 8, servings: 1 },
    { name: 'Chicken Breast', calories: 350, protein: 60, carbs: 0, fats: 5, servings: 1 }
  ];

  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('token', 'valid-test-token');
    jest.clearAllMocks();

    global.fetch = jest.fn((url, options) => {
      if (url.includes('/health/status')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) });
      }
      if (url.includes('/auth/me')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockUser) });
      }
      if (url.includes('/nutrition/hydration')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ total_ml: 1250, target_ml: 3000 }) });
      }
      if (url.includes('/food/today')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve(mockTodayNutrition) });
      }
      if (url.includes('/hydration/log')) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ total_ml: 1500 }) });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders user profile, level, and adaptive expenditure targets', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getAllByText('Marcus')[0]).toBeInTheDocument();
      expect(screen.getAllByText(/Lvl 4/i)[0]).toBeInTheDocument();
      expect(screen.getByText(/620 XP Accumulated/i)).toBeInTheDocument();
    });

    // Weight metric card
    expect(screen.getByText('80')).toBeInTheDocument();
    // Dynamic TDEE calculated
    expect(screen.getByText(/Dynamic Expenditure/i)).toBeInTheDocument();
  });

  test('calculates and renders macro adherence values and progress', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Nutrition & Macro Adherence/i)).toBeInTheDocument();
    });

    // Consumed calories: 400 + 350 = 750 kcal
    expect(screen.getByText('750')).toBeInTheDocument();
    // Consumed protein: 20 + 60 = 80g
    expect(screen.getByText('80g')).toBeInTheDocument();
  });

  test('allows quick logging water and updating hydration level', async () => {
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Hydration Index/i)).toBeInTheDocument();
      expect(screen.getByText(/1250/)).toBeInTheDocument();
    });

    const addWaterBtn = screen.getByText('+ 250ml');
    fireEvent.click(addWaterBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/hydration/log'),
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
