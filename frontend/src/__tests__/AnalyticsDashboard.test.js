import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AnalyticsDashboard from '../components/AnalyticsDashboard';

// Mock chart.js components
jest.mock('react-chartjs-2', () => ({
  Line: () => <div data-testid="line-chart">Line Chart</div>,
  Bar: () => <div data-testid="bar-chart">Bar Chart</div>,
  Doughnut: () => <div data-testid="doughnut-chart">Doughnut Chart</div>
}));

describe('AnalyticsDashboard Component', () => {
  const mockProps = {
    API_URL: 'http://localhost:8000',
    onProfileUpdate: jest.fn(),
    hydration: 1500,
    refreshHydration: jest.fn(),
  };

  const mockAnalyticsData = {
    stats: {
      total_workouts: 12,
      total_volume: 45000,
      current_streak: 7
    },
    best_lifts: [
      { exercise: 'Bench Press', weight: 120, date: '2026-08-01' }
    ],
    volume_chart: {
      labels: ['Mon', 'Wed', 'Fri'],
      data: [1200, 1500, 1800]
    },
    weight_trend: {
      labels: ['Aug 1', 'Aug 15', 'Sep 1'],
      data: [76.0, 75.2, 74.5]
    },
    muscle_split: {
      labels: ['Chest', 'Back', 'Legs'],
      data: [35, 35, 30]
    },
    consistency_heatmap: []
  };

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn((url) => {
      if (url.includes('/analytics/dashboard')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAnalyticsData)
        });
      }
      if (url.includes('/progress')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ weight: 74.5, photos: [] })
        });
      }
      if (url.includes('/sleep')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([])
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

  test('renders analytics dashboard summary metrics and charts', async () => {
    render(<AnalyticsDashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Total Workouts')).toBeInTheDocument();
      expect(screen.getByText('Current Streak')).toBeInTheDocument();
    });

    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  test('opens weight logging modal and allows entering new weight', async () => {
    render(<AnalyticsDashboard {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    });

    const logWeightBtn = screen.getByText(/Log Weight/i);
    fireEvent.click(logWeightBtn);

    expect(screen.getByText(/Log Current Weight/i)).toBeInTheDocument();
  });
});
