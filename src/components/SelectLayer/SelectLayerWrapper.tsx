import React, { useState } from 'react';
import SelectLayerNew from './SelectLayerNew';
import SlideBox from '../SlideBox/SlideBox.jsx';

interface SelectLayerWrapperProps {
  // Add any props that the original SelectLayer component might need
}

const SelectLayerWrapper: React.FC<SelectLayerWrapperProps> = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="SelectLayer" style={{zIndex: 1}}>
        <div
          className="
            h-12 w-12 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors
          "
          onClick={() => {
            setShowModal(!showModal);
          }}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className="w-6 h-6"
          >
            <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
            <polyline points="2 17 12 22 22 17"></polyline>
            <polyline points="2 12 12 17 22 12"></polyline>
          </svg>
        </div>
      </div>

      <SelectLayerNew
        isVisible={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};

export default SelectLayerWrapper; 