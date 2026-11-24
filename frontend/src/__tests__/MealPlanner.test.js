import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MealPlanner from '../components/MealPlanner';

describe('MealPlanner Component', () => {
  const mockProps = {
    API_URL: 'http://localhost:8000',
    token: 'test-token',
    setSuccess: jest.fn(),
    setError: jest.fn(),
  };

  const mockMealPlan = {
    meals: [
      { name: 'Oatmeal with Blueberries & Whey', calories: 420, protein: 32, carbs: 55, fat: 8, price: 150 },
      { name: 'Grilled Salmon with Quinoa', calories: 580, protein: 44, carbs: 48, fat: 16, price: 350 },
      { name: 'Lean Beef Sirloin & Sweet Potato', calories: 650, protein: 50, carbs: 50, fat: 18, price: 400 }
    ],
    total_calories: 1650,
    total_protein: 126
  };

  const mockGroceryList = {
    Produce: ['Blueberries', 'Sweet Potato'],
    Proteins: ['Whey Protein', 'Salmon', 'Beef Sirloin'],
    Grains: ['Oatmeal', 'Quinoa']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url) => {
      if (url.includes('/nutrition/meal-plan')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockMealPlan)
        });
      }
      if (url.includes('/nutrition/grocery-list')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockGroceryList)
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  test('renders meal planner controls and preference selectors', () => {
    render(<MealPlanner {...mockProps} />);
    expect(screen.getByText(/Meal Plan Generator/i)).toBeInTheDocument();
    expect(screen.getByText(/Diet Type/i)).toBeInTheDocument();
  });

  test('generates and displays meal plan upon clicking generate button', async () => {
    render(<MealPlanner {...mockProps} />);

    const generateBtn = screen.getByText(/Generate Personalized Plan/i);
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Oatmeal with Blueberries & Whey')).toBeInTheDocument();
      expect(screen.getByText('Grilled Salmon with Quinoa')).toBeInTheDocument();
      expect(screen.getByText('Lean Beef Sirloin & Sweet Potato')).toBeInTheDocument();
    });

    expect(mockProps.setSuccess).toHaveBeenCalledWith('Meal plan generated');
  });

  test('generates grocery list from active meal plan', async () => {
    render(<MealPlanner {...mockProps} />);

    const generateBtn = screen.getByText(/Generate Personalized Plan/i);
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(screen.getByText('Oatmeal with Blueberries & Whey')).toBeInTheDocument();
    });

    const groceryBtn = screen.getByText(/Generate Grocery List/i);
    fireEvent.click(groceryBtn);

    await waitFor(() => {
      expect(screen.getByText(/Produce/i)).toBeInTheDocument();
      expect(screen.getByText(/Blueberries/i)).toBeInTheDocument();
    });
  });
});
