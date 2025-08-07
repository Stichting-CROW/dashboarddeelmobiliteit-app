import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import NewFeatureIndicator from './NewFeatureIndicator';

// Mock the custom hook
jest.mock('../../customHooks/useNewFeature.js', () => ({
  useNewFeature: jest.fn()
}));

const mockUseNewFeature = require('../../customHooks/useNewFeature.js').useNewFeature;

const createTestStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      authentication: (state = { user_data: null, seenFeatures: {}, latestSeenVersion: null }, action) => {
        switch (action.type) {
          case 'MARK_FEATURE_AS_SEEN':
            return {
              ...state,
              seenFeatures: {
                ...state.seenFeatures,
                [action.payload]: true
              }
            };
          case 'SET_LATEST_SEEN_VERSION':
            return {
              ...state,
              latestSeenVersion: action.payload
            };
          default:
            return state;
        }
      }
    },
    preloadedState: initialState
  });
};

describe('NewFeatureIndicator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should show blue dot when feature is new', () => {
    mockUseNewFeature.mockReturnValue({
      isNew: true,
      markAsSeen: jest.fn()
    });

    render(
      <Provider store={createTestStore()}>
        <NewFeatureIndicator featureId="test-feature" version="2025-01-01">
          <button>Test Button</button>
        </NewFeatureIndicator>
      </Provider>
    );

    // Check if the blue dot is present
    const dot = document.querySelector('.new-feature-dot');
    expect(dot).toBeInTheDocument();
  });

  it('should not show blue dot when feature is not new', () => {
    mockUseNewFeature.mockReturnValue({
      isNew: false,
      markAsSeen: jest.fn()
    });

    render(
      <Provider store={createTestStore()}>
        <NewFeatureIndicator featureId="test-feature" version="2025-01-01">
          <button>Test Button</button>
        </NewFeatureIndicator>
      </Provider>
    );

    // Check if the blue dot is not present
    const dot = document.querySelector('.new-feature-dot');
    expect(dot).not.toBeInTheDocument();
  });

  it('should call markAsSeen when clicked', () => {
    const mockMarkAsSeen = jest.fn();
    mockUseNewFeature.mockReturnValue({
      isNew: true,
      markAsSeen: mockMarkAsSeen
    });

    render(
      <Provider store={createTestStore()}>
        <NewFeatureIndicator featureId="test-feature" version="2025-01-01">
          <button>Test Button</button>
        </NewFeatureIndicator>
      </Provider>
    );

    // Click on the indicator
    const indicator = document.querySelector('.new-feature-indicator');
    fireEvent.click(indicator);

    expect(mockMarkAsSeen).toHaveBeenCalled();
  });
}); 