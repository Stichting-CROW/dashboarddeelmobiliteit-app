import React from 'react';

export function IconButtonClose(props) {
  return (
    <div className="text-2xl font-bold cursor-pointer" onClick={props.onClick}
      style={props.style}
      >×</div>
  )
}

export function IconButtonFilter(props) {
  return (
    <div
      {...props}
      className="w-12 h-8 box-border border-2 border-black flex items-center justify-center p-3 rounded-full disabled:bg-transparent hover:bg-gray-300 active:bg-gray-400 focus:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:shadow-outline"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22.13 15.72">
        <path d="M7.16 0a3.7 3.7 0 0 0-3.6 2.86H.85a.85.85 0 0 0 0 1.7h2.71a3.7 3.7 0 0 0 7.2 0h10.52a.85.85 0 0 0 0-1.7H10.76A3.7 3.7 0 0 0 7.16 0zm0 5.72a2 2 0 1 1 2-2 2 2 0 0 1-2 2zM15 8.3a3.7 3.7 0 0 0-3.6 2.86H.85a.85.85 0 0 0 0 1.7h10.52a3.7 3.7 0 0 0 7.2 0h2.71a.85.85 0 0 0 0-1.7h-2.71A3.7 3.7 0 0 0 15 8.3zm0 5.7a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"></path>
      </svg>
    </div>);
}
