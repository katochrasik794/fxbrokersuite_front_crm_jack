function AuthLoader({ message = 'Processing...' }) {

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl p-10 sm:p-12 flex flex-col items-center justify-center min-w-[320px] max-w-[400px] mx-4 transform transition-all">
        {/* Enhanced Spinning Logo Container */}
        <div className="relative mb-8 w-40 h-40 flex items-center justify-center">
          {/* Outer rotating ring - smooth gradient */}
          <div className="absolute inset-0 w-40 h-40">
            <div className="absolute inset-0 border-4 border-transparent border-t-brand-500 border-r-brand-500 rounded-full animate-spin" style={{ animationDuration: '2s' }}></div>
            <div className="absolute inset-0 border-4 border-transparent border-b-brand-500 border-l-brand-500 rounded-full animate-spin opacity-50" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>
          </div>
          
          {/* Middle rotating ring - slower, opposite direction */}
          <div className="absolute inset-2 w-32 h-32">
            <div className="absolute inset-0 border-[3px] border-transparent border-t-[#e6c200] border-r-[#e6c200] rounded-full animate-spin opacity-80" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            <div className="absolute inset-0 border-[3px] border-transparent border-b-[#00A896] border-l-[#00A896] rounded-full animate-spin opacity-60" style={{ animationDuration: '1.5s' }}></div>
          </div>
          
          {/* Inner subtle ring */}
          <div className="absolute inset-4 w-24 h-24 border-2 border-blue-600/20 rounded-full"></div>
          
          {/* Logo in center - stable and centered */}
          <div className="relative z-10 w-20 h-20 flex items-center justify-center bg-white rounded-full shadow-lg">
            <img 
              src="/logo.png" 
              alt="fxbrokersuite Logo" 
              className="w-16 h-16 object-contain"
              style={{ filter: 'none' }}
            />
          </div>
          
          {/* Pulsing glow effect */}
          <div className="absolute inset-0 w-40 h-40 bg-blue-600/10 rounded-full animate-ping opacity-75"></div>
        </div>

        {/* Loading text with better typography */}
        <div className="text-center w-full">
          <p className="text-gray-900 font-semibold text-xl mb-4" style={{ fontFamily: 'Roboto, sans-serif', letterSpacing: '0.5px' }}>
            {message}
          </p>
          
          {/* Enhanced loading dots */}
          <div className="flex items-center justify-center gap-2">
            <div 
              className="w-3 h-3 bg-blue-600 rounded-full animate-bounce shadow-sm" 
              style={{ animationDelay: '0s', animationDuration: '1s' }}
            ></div>
            <div 
              className="w-3 h-3 bg-[#e6c200] rounded-full animate-bounce shadow-sm" 
              style={{ animationDelay: '0.2s', animationDuration: '1s' }}
            ></div>
            <div 
              className="w-3 h-3 bg-[#00A896] rounded-full animate-bounce shadow-sm" 
              style={{ animationDelay: '0.4s', animationDuration: '1s' }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthLoader
