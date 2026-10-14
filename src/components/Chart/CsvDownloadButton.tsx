import React from 'react';

export interface CsvDownloadButtonProps {
  onClick: () => void;
  /** Accessible label and tooltip. */
  title?: string;
  /** Icon width and height in pixels. */
  size?: number;
  className?: string;
}

const CsvDownloadButton: React.FC<CsvDownloadButtonProps> = ({
  onClick,
  title = 'Download als CSV',
  size = 18,
  className = ''
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={title}
      title={title}
      className={`opacity-50 hover:opacity-100 cursor-pointer ${className}`}
    >
      <img
        src="/components/StatsPage/icon-download-to-csv.svg"
        width={size}
        height={size}
        alt=""
      />
    </button>
  );
};

export default CsvDownloadButton;
