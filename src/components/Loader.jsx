import { useState, useEffect } from 'react'

function Loader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Hide loader after page loads
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000) // Show for 1 second minimum

    // Also hide when page is fully loaded
    if (document.readyState === 'complete') {
      setIsLoading(false)
    } else {
      window.addEventListener('load', () => {
        setIsLoading(false)
      })
    }

    return () => {
      clearTimeout(timer)
      window.removeEventListener('load', () => setIsLoading(false))
    }
  }, [])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="animate-pulse">
        <img 
          src="/logo.png" 
          alt="Loading" 
          className="h-16 w-auto"
          style={{ maxWidth: '300px' }}
        />
      </div>
    </div>
  )
}

export default Loader

