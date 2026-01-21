import React from 'react';

function Card({ children, className = '', hover = false, ...props }) {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 transition-all duration-200 ${
        hover ? 'hover:shadow-md hover:border-gray-300' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;

