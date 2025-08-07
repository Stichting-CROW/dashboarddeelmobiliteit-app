# NewFeatureIndicator Component

This component provides a generic way to highlight new features in the application with a blue dot indicator.

## Usage

### Basic Usage

```tsx
import NewFeatureIndicator from '../NewFeatureIndicator/NewFeatureIndicator';

function MyComponent() {
  return (
    <NewFeatureIndicator 
      featureId="my-new-feature"
      version="2025-01-01"
    >
      <button onClick={handleClick}>
        My New Feature
      </button>
    </NewFeatureIndicator>
  );
}
```

### With Custom Styling

```tsx
<NewFeatureIndicator 
  featureId="custom-styled-feature"
  version="2025-01-01"
  className="my-custom-class"
  style={{ margin: '10px' }}
>
  <div>Your content here</div>
</NewFeatureIndicator>
```

## Props

- `featureId` (string, required): Unique identifier for the feature
- `version` (string, required): Version date when this feature was introduced (format: 'YYYY-MM-DD')
- `children` (ReactNode, required): The element to wrap with the indicator
- `className` (string, optional): Additional CSS classes
- `style` (CSSProperties, optional): Additional inline styles

## How It Works

1. **Version Tracking**: The system tracks the latest version date the user has seen
2. **Feature-specific Tracking**: Each feature is marked as seen when the user clicks on it
3. **Persistence**: Data is stored in both Redux state and localStorage
4. **Automatic Hiding**: The blue dot disappears when:
   - The user clicks on the feature
   - The user has seen a version later than or equal to the feature's version

## Version Format

Use the format `YYYY-MM-DD` for version dates, for example:
- `2025-01-01` for January 1st, 2025
- `2025-08-15` for August 15th, 2025

## Redux State

The system uses the `authentication` reducer to store:
- `seenFeatures`: Object mapping feature IDs to boolean values
- `latestSeenVersion`: String representing the latest version date the user has seen

## localStorage

The system automatically persists data in localStorage:
- `seenFeatures`: JSON string of seen features
- `latestSeenVersion`: String of the latest seen version 