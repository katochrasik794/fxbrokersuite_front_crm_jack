import { useState, useEffect } from 'react'
import { Monitor, Download, Play, Smartphone, Globe, Copy, ArrowRight } from 'lucide-react'
import Swal from 'sweetalert2'
import PageHeader from '../components/PageHeader.jsx'

function Platforms() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Download links
  const MT5_DESKTOP_MAC = 'https://download.mql5.com/cdn/web/metaquotes.ltd/mt5/MetaTrader5.pkg.zip?utm_source=support.metaquotes.net&utm_campaign=download.mt5.macos'
  const MT5_DESKTOP_WINDOWS = 'https://download.mql5.com/cdn/web/fxbrokersuite.com/mt5/fxbrokersuite5setup.exe'
  const MT5_MOBILE_IOS = 'https://download.mql5.com/cdn/mobile/mt5/ios?server=FxBrokerSuite-Live'
  const MT5_MOBILE_ANDROID = 'https://download.mql5.com/cdn/mobile/mt5/android?server=FxBrokerSuite-Live'

  const handleDownload = (url, platformName) => {
    if (url) {
      window.open(url, '_blank')
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Coming Soon',
        text: `${platformName} will be available soon. Please check back later.`,
        confirmButtonColor: '#3b82f6'
      })
    }
  }

  const handleLaunch = (url, platformName) => {
    if (url) {
      window.open(url, '_blank')
    } else {
      Swal.fire({
        icon: 'info',
        title: 'Coming Soon',
        text: `${platformName} will be available soon. Please check back later.`,
        confirmButtonColor: '#3b82f6'
      })
    }
  }

  // Consistent button component
  const ActionButton = ({ onClick, children, variant = 'primary', icon: Icon, className = '' }) => {
    const baseClasses = "flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300"
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-dark-base',
      secondary: 'bg-blue-600 hover:bg-blue-700 text-dark-base border-2 border-blue-600',
      outline: 'bg-white border-2 border-blue-600 hover:bg-brand-50 text-dark-base'
    }

    return (
      <button
        onClick={onClick}
        className={`${baseClasses} ${variants[variant]} ${className}`}
        style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px' }}
      >
        {Icon && <Icon className="w-5 h-5" />}
        {children}
      </button>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen overflow-x-hidden w-full">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-brand-500/10 via-brand-500/5 to-transparent py-16 w-full">
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <PageHeader
              icon={Monitor}
              title="Trading Platforms"
              subtitle="Professional platform for online trading in financial markets. Access powerful tools across desktop, web, and mobile devices."
            />
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-12">
        {/* Desktop Terminal Section */}
        <section className="mb-20">
          <div className={`transition-all duration-1000 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4 text-center" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
              Desktop Terminal
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Advanced desktop trading platform with professional tools and features
            </p>
            
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 w-full">
              <div className="grid md:grid-cols-2 gap-0 w-full">
                {/* Image Section */}
                <div className="relative h-96 md:h-[500px] lg:h-[600px] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden group w-full">
                  <img 
                    src="/terminal.jpg" 
                    alt="MetaTrader 5 Desktop Terminal" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = '/mt5.png' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content Section */}
                <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center w-full">
                  <h3 className="text-3xl font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                    MetaTrader 5 Terminal
                  </h3>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    The advanced version of MetaTrader 4. It is faster and more efficient. MetaTrader 5 allows trading more instruments in almost all financial markets with professional-grade tools and analytics.
                  </p>
                  <ul className="space-y-3 mb-8" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>Twice as many time frames as MT4 with enhanced charting</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>Integrated Economic Calendar with real-time news</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>38 built-in technical indicators and 44 graphical objects</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>Advanced order management and position tracking</span>
                    </li>
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <ActionButton 
                      onClick={() => handleDownload(MT5_DESKTOP_WINDOWS, 'Windows')}
                      variant="primary"
                      icon={Download}
                      className="flex-1"
                    >
                      Download for Windows
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleDownload(MT5_DESKTOP_MAC, 'macOS')}
                      variant="primary"
                      icon={Download}
                      className="flex-1"
                    >
                      Download for macOS
                    </ActionButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Web Trading Section */}
        <section className="mb-20">
          <div className={`transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4 text-center" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
              Web Trading Platforms
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Trade directly from your browser - no installation required
            </p>
            
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 w-full">
              {/* MT5 WebTrader */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group w-full">
                <div className="relative h-64 lg:h-80 bg-gradient-to-br from-blue-50 to-indigo-100 overflow-hidden w-full">
                  <img 
                    src="/mt5_web_trader.jpg" 
                    alt="MT5 WebTrader" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = '/mt5.png' }}
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Globe className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                      MT5 WebTrader
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    The most popular trading platform used by millions of traders worldwide. Everything you need: charts, assets, order placement, and position management - all in your browser.
                  </p>
                  <ul className="space-y-2 mb-6" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '15px' }}>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Mirror successful traders in real-time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>2,000+ products with dynamic leverage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Robust security and built-in tools</span>
                    </li>
                  </ul>
                  <ActionButton 
                    onClick={() => handleLaunch(null, 'MT5 WebTrader')}
                    variant="primary"
                    icon={Play}
                    className="w-full"
                  >
                    Launch WebTrader
                  </ActionButton>
                </div>
              </div>

              {/* fxbrokersuite Copy */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group relative w-full">
                <div className="absolute top-6 right-6 z-10">
                  <span className="px-3 py-1 bg-blue-600 text-dark-base text-sm font-bold rounded-full shadow-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    New
                  </span>
                </div>
                <div className="relative h-64 lg:h-80 bg-gradient-to-br from-purple-50 to-pink-100 overflow-hidden w-full">
                  <img 
                    src="/copier_banner.png" 
                    alt="fxbrokersuite Copy" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onError={(e) => { e.target.src = '/copy-trade-banner-secondary.svg' }}
                  />
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Copy className="w-8 h-8 text-blue-600" />
                    <h3 className="text-2xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                      fxbrokersuite Copy
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    An advanced and fast trading platform that simplifies your trading by copying trades and portfolios from other traders instantly. Perfect for both beginners and experienced traders.
                  </p>
                  <ul className="space-y-2 mb-6" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '15px' }}>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Copy trades and portfolios instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>2000+ products with dynamic leverage</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600">•</span>
                      <span>Robust security and built-in analytics</span>
                    </li>
                  </ul>
                  <ActionButton 
                    onClick={() => handleLaunch(null, 'fxbrokersuite Copy')}
                    variant="primary"
                    icon={Play}
                    className="w-full"
                  >
                    Launch fxbrokersuite Copy
                  </ActionButton>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mobile Platform Section */}
        <section className="mb-20">
          <div className={`transition-all duration-1000 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <h2 className="text-4xl font-bold mb-4 text-center" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
              Mobile Trading Apps
            </h2>
            <p className="text-center text-gray-600 mb-12 text-lg" style={{ fontFamily: 'Roboto, sans-serif' }}>
              Trade on the go with our powerful mobile applications
            </p>
            
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200 hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 w-full">
              <div className="grid md:grid-cols-2 gap-0 w-full">
                {/* Content Section */}
                <div className="p-6 sm:p-8 md:p-10 lg:p-12 flex flex-col justify-center order-2 md:order-1 w-full">
                  <div className="flex items-center gap-3 mb-4">
                    <Smartphone className="w-8 h-8 text-blue-600" />
                    <h3 className="text-3xl font-bold" style={{ fontFamily: 'Roboto, sans-serif', color: '#000000' }}>
                      MetaTrader 5 Mobile
                    </h3>
                  </div>
                  <p className="text-gray-700 mb-6 text-lg leading-relaxed" style={{ fontFamily: 'Roboto, sans-serif' }}>
                    The mobile version of MT5 provides everything needed to perform trading operations, send pending orders, and set protective Stop Loss and Take Profit levels - all from your smartphone or tablet.
                  </p>
                  <ul className="space-y-3 mb-8" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px' }}>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>One Click Trading for instant execution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>Trade from the price chart or Market Depth window</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>Full-featured technical analysis on mobile</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-blue-600 text-xl mt-1">•</span>
                      <span>Real-time quotes and market notifications</span>
                    </li>
                  </ul>
                  <div className="flex flex-col gap-4">
                    <ActionButton 
                      onClick={() => handleDownload(MT5_MOBILE_ANDROID, 'Android')}
                      variant="primary"
                      icon={Download}
                      className="w-full"
                    >
                      Download for Android
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleDownload(MT5_MOBILE_IOS, 'iOS')}
                      variant="primary"
                      icon={Download}
                      className="w-full"
                    >
                      Download for iOS
                    </ActionButton>
                  </div>
                </div>

                {/* Image Section */}
                <div className="relative min-h-[400px] sm:min-h-[500px] md:min-h-[600px] lg:min-h-[700px] bg-gradient-to-br from-brand-500/5 via-brand-500/10 to-transparent overflow-hidden group order-1 md:order-2 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 w-full">
                  <div className="relative w-full h-full max-w-full">
                    {/* Android Phone - Left/Top */}
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 md:left-4 lg:left-8 md:top-12 transform md:rotate-12 hover:rotate-6 transition-all duration-500 z-10 hover:scale-110">
                      <div className="relative w-36 h-64 sm:w-44 sm:h-80 md:w-52 md:h-96 lg:w-56 lg:h-[28rem] bg-gradient-to-br from-gray-900 to-black rounded-[2rem] sm:rounded-[2.5rem] p-2 sm:p-2.5 shadow-2xl">
                        <div className="absolute inset-2 bg-gradient-to-br from-gray-50 to-white rounded-[2rem] overflow-hidden">
                          <img 
                            src="/mobile_1.jpg" 
                            alt="MT5 Android App" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/mt5.png' }}
                          />
                        </div>
                        {/* Phone bezel styling */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full"></div>
                      </div>
                    </div>

                    {/* iOS Phone - Right/Bottom */}
                    <div className="absolute right-0 bottom-1/2 translate-y-1/2 md:right-4 lg:right-8 md:bottom-12 transform md:-rotate-12 hover:-rotate-6 transition-all duration-500 z-20 hover:scale-110">
                      <div className="relative w-36 h-64 sm:w-44 sm:h-80 md:w-52 md:h-96 lg:w-56 lg:h-[28rem] bg-gradient-to-br from-gray-100 to-white rounded-[2rem] sm:rounded-[2.5rem] p-2 sm:p-2.5 shadow-2xl border-2 sm:border-4 border-gray-300">
                        <div className="absolute inset-2 bg-white rounded-[2rem] overflow-hidden shadow-inner">
                          <img 
                            src="/mobile_2.jpg" 
                            alt="MT5 iOS App" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/mt5.png' }}
                          />
                        </div>
                        {/* Phone bezel styling */}
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-8 bg-black rounded-full"></div>
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-6 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Decorative background elements */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-600 rounded-full blur-3xl"></div>
                      <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-600 rounded-full blur-3xl"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default Platforms
