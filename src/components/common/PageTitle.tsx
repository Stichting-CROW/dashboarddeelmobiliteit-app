import React from 'react';

interface PageTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

function PageTitle({
  children,
  className = '',
  style
}: PageTitleProps) {
  return (
    <h1 
      className={`text-4xl leading-[41px] font-semibold text-black font-sans ${className}`} 
      style={style}
    >
      {children}
    </h1>
  );
}

export default PageTitle;
