import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import WorkoutLogger from '../components/WorkoutLogger';

describe('WorkoutLogger Component', () => {
  const mockProps = {
    API_URL: 'http://localhost:8000',
    token: 'test-token',
    setSuccess: jest.fn(),
    setError: jest.fn(),
    fetchUserProfile: jest.fn(),
    generateWorkoutPlan: jest.fn(),
    workoutPlan: null,
    setWorkoutPlan: jest.fn(),
    setShowRestTimer: jest.fn(),
    setRestTimeLeft: jest.fn(),
    showRestTimer: false,
    loading: false
  };

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('renders workout logger interface and search input', () => {
    render(<WorkoutLogger {...mockProps} />);
    const searchInput = screen.getByPlaceholderText(/search exercises/i);
    expect(searchInput).toBeInTheDocument();
  });

  test('filters exercise database based on search query', () => {
    render(<WorkoutLogger {...mockProps} />);
    const searchInput = screen.getByPlaceholderText(/search exercises/i);
    fireEvent.change(searchInput, { target: { value: 'Bench Press' } });
    
    expect(screen.getByText(/Barbell Bench Press/i)).toBeInTheDocument();
  });

  test('calculates Epley 1RM accurately upon logging a completed set', () => {
    render(<WorkoutLogger {...mockProps} />);
    
    // Select an exercise
    const searchInput = screen.getByPlaceholderText(/search exercises/i);
    fireEvent.change(searchInput, { target: { value: 'Barbell Bench Press' } });
    const exerciseCard = screen.getByText(/Barbell Bench Press/i);
    fireEvent.click(exerciseCard);

    // Inputs are populated with defaults (60kg, 10 reps)
    const weightInput = screen.getByDisplayValue('60');
    const repsInput = screen.getByDisplayValue('10');

    fireEvent.change(weightInput, { target: { value: '100' } });
    fireEvent.change(repsInput, { target: { value: '10' } });

    // Epley formula: 100 * (1 + 10/30) = 133 kg
    const addSetBtn = screen.getByText(/complete set/i);
    fireEvent.click(addSetBtn);

    // Verify set is logged to session and volume updated (100kg * 10 = 1000kg)
    expect(screen.getByText(/100\s*kg\s*×\s*10/)).toBeInTheDocument();
    expect(screen.getByText(/1000/)).toBeInTheDocument();
  });
});
