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
    const baseClasses = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform active:scale-95"
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40',
      secondary: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 shadow-sm hover:shadow-md',
      outline: 'bg-transparent border-2 border-blue-600 hover:bg-blue-50 text-blue-600'
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
    <div className="bg-slate-50 min-h-screen overflow-x-hidden w-full pb-12">
      <div className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
        <PageHeader
          icon={Monitor}
          title="Trading Platforms"
          subtitle="Access professional trading tools across desktop, web, and mobile devices."
        />
      </div>

      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 space-y-12 mt-8">
        {/* Desktop Terminal Section */}
        <section>
          <div className={`transition-all duration-700 delay-100 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-2xl font-bold mb-6 text-slate-900 px-1">
              Desktop Terminal
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 w-full">
              <div className="grid md:grid-cols-2 gap-0 w-full">
                {/* Image Section */}
                <div className="relative h-96 md:h-auto min-h-[500px] bg-slate-100 overflow-hidden group w-full">
                  <img 
                    src="/terminal.jpg" 
                    alt="MetaTrader 5 Desktop Terminal" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = '/mt5.png' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>

                {/* Content Section */}
                <div className="p-8 lg:p-12 flex flex-col justify-center w-full">
                  <h3 className="text-3xl font-bold mb-4 text-slate-900">
                    MetaTrader 5 Terminal
                  </h3>
                  <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                    The advanced version of MetaTrader 4. It is faster and more efficient. MetaTrader 5 allows trading more instruments in almost all financial markets with professional-grade tools and analytics.
                  </p>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">Twice as many time frames as MT4 with enhanced charting</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">Integrated Economic Calendar with real-time news</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">38 built-in technical indicators and 44 graphical objects</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">Advanced order management and position tracking</span>
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
                      variant="secondary"
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
        <section>
          <div className={`transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-2xl font-bold mb-6 text-slate-900 px-1">
              Web Trading Platforms
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 w-full">
              {/* MT5 WebTrader */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group w-full flex flex-col">
                <div className="relative h-64 bg-slate-100 overflow-hidden w-full">
                  <img 
                    src="/mt5_web_trader.jpg" 
                    alt="MT5 WebTrader" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = '/mt5.png' }}
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-300"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Globe className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      MT5 WebTrader
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-6 leading-relaxed flex-1">
                    The most popular trading platform used by millions of traders worldwide. Everything you need: charts, assets, order placement, and position management - all in your browser.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Mirror successful traders in real-time</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>2,000+ products with dynamic leverage</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
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
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 group relative w-full flex flex-col">
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full shadow-lg shadow-blue-600/20">
                    New
                  </span>
                </div>
                <div className="relative h-64 bg-slate-100 overflow-hidden w-full">
                  <img 
                    src="/copier_banner.png" 
                    alt="fxbrokersuite Copy" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => { e.target.src = '/copy-trade-banner-secondary.svg' }}
                  />
                  <div className="absolute inset-0 bg-slate-900/10 group-hover:bg-transparent transition-colors duration-300"></div>
                </div>
                <div className="p-8 flex-1 flex flex-col">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl">
                      <Copy className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">
                      fxbrokersuite Copy
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-6 leading-relaxed flex-1">
                    An advanced and fast trading platform that simplifies your trading by copying trades and portfolios from other traders instantly. Perfect for both beginners and experienced traders.
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Copy trades and portfolios instantly</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>2000+ products with dynamic leverage</span>
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="text-blue-600 font-bold">•</span>
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
        <section>
          <div className={`transition-all duration-700 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h2 className="text-2xl font-bold mb-6 text-slate-900 px-1">
              Mobile Trading Apps
            </h2>
            
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all duration-300 w-full">
              <div className="grid md:grid-cols-2 gap-0 w-full">
                {/* Content Section */}
                <div className="p-8 lg:p-12 flex flex-col justify-center order-2 md:order-1 w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Smartphone className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-3xl font-bold text-slate-900">
                      MetaTrader 5 Mobile
                    </h3>
                  </div>
                  <p className="text-slate-600 mb-8 text-lg leading-relaxed">
                    The mobile version of MT5 provides everything needed to perform trading operations, send pending orders, and set protective Stop Loss and Take Profit levels - all from your smartphone or tablet.
                  </p>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">One Click Trading for instant execution</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">Trade from the price chart or Market Depth window</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">Full-featured technical analysis on mobile</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-blue-600 text-sm font-bold">✓</span>
                      </div>
                      <span className="text-slate-700">Real-time quotes and market notifications</span>
                    </li>
                  </ul>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <ActionButton 
                      onClick={() => handleDownload(MT5_MOBILE_ANDROID, 'Android')}
                      variant="primary"
                      icon={Download}
                      className="flex-1"
                    >
                      Download for Android
                    </ActionButton>
                    <ActionButton 
                      onClick={() => handleDownload(MT5_MOBILE_IOS, 'iOS')}
                      variant="secondary"
                      icon={Download}
                      className="flex-1"
                    >
                      Download for iOS
                    </ActionButton>
                  </div>
                </div>

                {/* Image Section */}
                <div className="relative min-h-[400px] md:min-h-[600px] bg-slate-50 overflow-hidden group order-1 md:order-2 flex items-center justify-center p-8 lg:p-12 w-full">
                  <div className="relative w-full h-full max-w-full flex items-center justify-center">
                    {/* Android Phone - Left/Top */}
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 md:left-8 md:top-12 transform md:rotate-12 hover:rotate-6 transition-all duration-500 z-10 hover:scale-105">
                      <div className="relative w-36 h-64 sm:w-44 sm:h-80 md:w-52 md:h-96 bg-slate-800 rounded-[2.5rem] p-2 shadow-2xl ring-4 ring-slate-200/50">
                        <div className="absolute inset-2 bg-slate-100 rounded-[2rem] overflow-hidden">
                          <img 
                            src="/mobile_1.jpg" 
                            alt="MT5 Android App" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/mt5.png' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* iOS Phone - Right/Bottom */}
                    <div className="absolute right-4 bottom-1/2 translate-y-1/2 md:right-8 md:bottom-12 transform md:-rotate-12 hover:-rotate-6 transition-all duration-500 z-20 hover:scale-105">
                      <div className="relative w-36 h-64 sm:w-44 sm:h-80 md:w-52 md:h-96 bg-white rounded-[2.5rem] p-2 shadow-2xl ring-4 ring-slate-200/50">
                        <div className="absolute inset-2 bg-slate-100 rounded-[2rem] overflow-hidden">
                          <img 
                            src="/mobile_2.jpg" 
                            alt="MT5 iOS App" 
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/mt5.png' }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Decorative background elements */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
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
