import { useNavigate } from 'react-router-dom'

function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="mb-8">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="h-20 w-auto"
          style={{ maxWidth: '300px' }}
        />
      </div>

      {/* 404 Text */}
      <h1 className="text-9xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
        404
      </h1>

      {/* Page Not Found Message */}
      <h2 className="text-3xl font-semibold text-gray-700 mb-4" style={{ fontFamily: 'Roboto, sans-serif' }}>
        Page Not Found
      </h2>

      {/* Description */}
      <p className="text-lg text-gray-600 text-center max-w-md mb-8" style={{ fontFamily: 'Roboto, sans-serif' }}>
        The page you are looking for doesn't exist or has been moved to a different location.
      </p>

      {/* Go Home Button */}
      <button
        onClick={() => navigate('/')}
        className="bg-[#e6c200] hover:bg-[#d4b000] text-gray-900 px-8 py-3 rounded-lg transition-colors font-medium"
        style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}
      >
        Go Home
      </button>
    </div>
  )
}

export default NotFound

