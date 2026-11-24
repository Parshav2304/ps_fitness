import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import NutritionLogger from '../components/NutritionLogger';

describe('NutritionLogger Component', () => {
  const mockProps = {
    API_URL: 'http://localhost:8000',
    token: 'test-token',
    setSuccess: jest.fn(),
    setError: jest.fn(),
  };

  const mockFoods = [
    {
      id: 'food-1',
      name: 'Grilled Chicken Breast',
      calories: 300,
      protein: 55,
      carbs: 0,
      fats: 6,
      servings: 1,
      meal: 'breakfast'
    },
    {
      id: 'food-2',
      name: 'Brown Rice',
      calories: 220,
      protein: 5,
      carbs: 45,
      fats: 2,
      servings: 1,
      meal: 'lunch'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url, options) => {
      if (url.includes('/food/today')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFoods)
        });
      }
      if (url.includes('/food/recent')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
        });
      }
      if (options?.method === 'DELETE') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: 'Deleted' })
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

  test('fetches and displays logged food items and calculates macro totals', async () => {
    render(<NutritionLogger {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Grilled Chicken Breast')).toBeInTheDocument();
      expect(screen.getByText('Brown Rice')).toBeInTheDocument();
    });

    // Total calories: 300 + 220 = 520 kcal
    expect(screen.getByText(/520/)).toBeInTheDocument();
    // Total protein: 55 + 5 = 60g
    expect(screen.getByText(/60g/)).toBeInTheDocument();
  });

  test('opens the Add Food modal when Log Food button is clicked', async () => {
    render(<NutritionLogger {...mockProps} />);

    const logFoodBtn = screen.getByRole('button', { name: /Log Food/i });
    fireEvent.click(logFoodBtn);

    expect(screen.getByRole('heading', { name: /Log Food/i })).toBeInTheDocument();
  });

  test('deletes a food entry on delete button click', async () => {
    render(<NutritionLogger {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Grilled Chicken Breast')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole('button', { name: '×' });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(mockProps.setSuccess).toHaveBeenCalledWith('Food deleted');
    });
  });
});
