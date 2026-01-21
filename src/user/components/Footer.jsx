import { Link } from 'react-router-dom'

function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center">
          <Link 
            to="/user/legal" 
            className="text-black hover:underline transition-colors" 
            style={{ 
              fontSize: '14px', 
              fontFamily: 'Roboto, sans-serif', 
              fontWeight: '400',
              color: '#000000'
            }}
          >
            Legal Terms and Policies
          </Link>
        </div>
      </div>
    </footer>
  )
}

export default Footer





