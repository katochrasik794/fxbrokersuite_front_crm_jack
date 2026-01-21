import React from 'react';

function WaveLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="flex space-x-2 mb-4">
        <div className="w-3 h-3 bg-ib-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-3 h-3 bg-ib-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-3 h-3 bg-ib-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
      <p className="text-sm text-gray-600">{message}</p>
    </div>
  );
}

export default WaveLoader;


