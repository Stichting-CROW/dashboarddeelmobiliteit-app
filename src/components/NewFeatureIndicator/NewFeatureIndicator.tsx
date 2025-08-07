import React from 'react';
import { useNewFeature } from '../../customHooks/useNewFeature.js';
import './NewFeatureIndicator.css';

interface NewFeatureIndicatorProps {
  featureId: string;
  version: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Component that wraps any element and shows a blue dot indicator for new features
 * @param featureId - Unique identifier for the feature
 * @param version - Version date when this feature was introduced (format: 'YYYY-MM-DD')
 * @param children - The element to wrap with the indicator
 * @param className - Additional CSS classes
 * @param style - Additional inline styles
 */
export const NewFeatureIndicator: React.FC<NewFeatureIndicatorProps> = ({
  featureId,
  version,
  children,
  className = '',
  style = {}
}) => {
  const { isNew, markAsSeen } = useNewFeature(featureId, version);

  const handleClick = () => {
    if (isNew) {
      markAsSeen();
    }
  };

  return (
    <div 
      className={`new-feature-indicator ${className}`}
      style={style}
      onClick={handleClick}
    >
      {children}
      {isNew && (
        <div 
          className="new-feature-dot"
          title="Nieuw!"
        />
      )}
    </div>
  );
};

export default NewFeatureIndicator; 