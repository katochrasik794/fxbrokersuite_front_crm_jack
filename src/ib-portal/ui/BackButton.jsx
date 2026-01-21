import React from 'react';
import { useNavigate } from 'react-router-dom';

function BackButton({ onClick, to, className = '' }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${className}`}
      style={{
        backgroundColor: '#c8f300',
        color: '#081428',
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#a3c600';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#c8f300';
      }}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      <span>Back</span>
    </button>
  );
}

export default BackButton;

