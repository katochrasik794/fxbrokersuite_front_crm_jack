import { useState, useEffect } from 'react';
import { ChevronRight, ArrowDownToLine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.js';
import PageHeader from '../components/PageHeader.jsx';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL?.replace('/api', '') || import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function Deposits() {
  const navigate = useNavigate();
  const [gateways, setGateways] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kycStatus, setKycStatus] = useState(null);
  const [kycLoading, setKycLoading] = useState(true);

  useEffect(() => {
    checkKYCStatus();
    fetchGateways();
  }, []);

  const checkKYCStatus = async () => {
    try {
      setKycLoading(true);
      const token = authService.getToken();
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/kyc/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Normalize status to lowercase for consistent checking
          const status = (data.data.status || 'unverified').toLowerCase();
          setKycStatus(status);
        } else {
          setKycStatus('unverified');
        }
      } else {
        setKycStatus('unverified');
      }
    } catch (error) {
      console.error('Error checking KYC status:', error);
      setKycStatus('unverified');
    } finally {
      setKycLoading(false);
    }
  };

  // Check if KYC is approved (case-insensitive)
  const isKYCApproved = String(kycStatus || '').toLowerCase() === 'approved';

  const fetchGateways = async () => {
    try {
      setLoading(true);
      const token = authService.getToken();
      const response = await fetch(`${API_BASE_URL}/deposits/gateways`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setGateways(data.gateways || []);
        }
      }
    } catch (error) {
      console.error('Error fetching gateways:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGatewayClick = (gateway) => {
    navigate(`/user/deposits/${gateway.id}?step=1`);
  };

  // Group gateways
  const recommendedGateways = gateways.filter(g => g.is_recommended);
  const cryptoGateways = gateways.filter(g => g.type === 'crypto' && !g.is_recommended);
  const wireGateways = gateways.filter(g => g.type === 'wire');
  const otherGateways = gateways.filter(g => !g.is_recommended && g.type !== 'crypto' && g.type !== 'wire');

  // Helper to resolve URL
  const getFullUrl = (url) => {
    if (!url) return null;

    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    // If it is an absolute URL
    if (url.startsWith('http')) {
      // CRITICAL FIX: If we are on a live site (!isLocalhost) but the image URL 
      // is pointing to localhost or 127.0.0.1 (misconfigured backend), force it to be relative.
      if (!isLocalhost && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
      }
      return url;
    }

    // If BACKEND_URL is explicitly set (and likely correct from env), use it
    if (BACKEND_URL && !BACKEND_URL.includes('localhost') && !BACKEND_URL.includes('127.0.0.1')) {
      return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // Only fallback to localhost:5000 if we are actually on localhost/dev
    if (isLocalhost) {
      const localBase = BACKEND_URL || 'http://localhost:5000';
      return `${localBase}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    // In production, if no valid BACKEND_URL, assume relative path (same origin)
    return url.startsWith('/') ? url : `/${url}`;
  };

  const renderGatewayCard = (gateway) => (
    <div
      key={gateway.id}
      onClick={() => handleGatewayClick(gateway)}
      className="bg-gray-200 rounded-lg p-2.5 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
    >
      <div className="flex items-center flex-1">
        <div className="w-14 h-14 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden bg-transparent">
          {gateway.icon_url ? (
            <img
              src={getFullUrl(gateway.icon_url)}
              alt={gateway.name}
              className="w-full h-full object-contain"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none'; // Hide broken image
                e.target.parentNode.innerHTML = '<div class="w-full h-full bg-gray-300 rounded flex items-center justify-center text-xs text-gray-500">Img</div>';
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-300 rounded"></div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="mb-0.5" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#000000', fontWeight: '400' }}>
            {gateway.name}
          </h3>
          <p className="text-gray-600 mb-0.5" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
            Fee: 0% Time: {gateway.type === 'wire' ? '1-3 days' : 'Instant'}
          </p>
          <p className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
            Currencies: USD, EUR, GBP & more
          </p>
        </div>
      </div>
      <ChevronRight className="w-4 h-4 text-black ml-3 flex-shrink-0" />
    </div>
  );

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden relative">
      {/* Loading State */}
      {kycLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-500 mb-4"></div>
            <p className="text-gray-600">Checking verification status...</p>
          </div>
        </div>
      )}

      {/* Blur Overlay - Show when KYC is not approved */}
      {!kycLoading && !isKYCApproved && (
        <div className="fixed inset-0 bg-white bg-opacity-75 backdrop-blur-sm z-40 flex items-center justify-center p-4">
          {/* KYC Verification Modal */}
          <div className="bg-white rounded-lg shadow-2xl p-6 sm:p-8 w-full max-w-lg sm:max-w-xl md:max-w-2xl border border-gray-200">
            <div className="text-center">
              {/* Icon */}
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
                <svg className="h-8 w-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              {/* Title */}
              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                KYC Verification Required
              </h2>
              
              {/* Message */}
              <p className="text-gray-600 mb-6">
                To proceed with deposits, please complete your KYC (Know Your Customer) verification. This is required for security and regulatory compliance.
              </p>
              
              {/* Button */}
              <button
                onClick={() => navigate('/user/verification')}
                className="w-full bg-brand-500 hover:bg-brand-600 text-dark-base border border-brand-500 py-3 rounded-lg transition-colors font-semibold text-base"
              >
                Go to KYC Verification
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`max-w-2xl w-full ${!isKYCApproved && !kycLoading ? 'opacity-50 pointer-events-none' : ''}`}>
        <PageHeader
          icon={ArrowDownToLine}
          title="Deposit Types"
          subtitle="Choose your preferred deposit method to fund your trading account."
        />

        {loading ? (
          <div className="text-center py-8">Loading deposit methods...</div>
        ) : (
          <>
            {/* Recommended methods */}
            {recommendedGateways.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '400' }}>
                  Recommended methods
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendedGateways.map(renderGatewayCard)}
                </div>
              </div>
            )}

            {/* Additional Payment Methods */}
            {otherGateways.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '400' }}>
                  Additional Payment Methods
                </h2>
                <p className="text-gray-600 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400' }}>
                  Explore More Ways to Deposit Funds.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {otherGateways.map(renderGatewayCard)}
                </div>
              </div>
            )}

            {/* Cryptocurrencies */}
            <div className="mb-8">
              <h2 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '400' }}>
                Cryptocurrencies
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Static USDT TRC20 Card - Use logo from gateways if available */}
                {(() => {
                  const usdtGateway = gateways.find(g => g.name?.toLowerCase().includes('usdt') && g.name?.toLowerCase().includes('trc20'));

                  // Helper to resolve URL
                  const getFullUrl = (url) => {
                    if (!url) return null;
                    if (url.startsWith('http')) return url;
                    return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
                  };

                  const logoUrl = getFullUrl(usdtGateway?.icon_url) || '/tether.svg';
                  return (
                    <div
                      onClick={() => navigate('/user/deposits/cregis-usdt-trc20')}
                      className="bg-gray-200 rounded-lg p-2.5 border border-gray-200 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-14 h-14 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 overflow-hidden bg-transparent">
                          <img src={logoUrl} alt="USDT TRC20" className="w-full h-full object-contain" />
                        </div>
                        <div className="flex-1">
                          <h3 className="mb-0.5" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#000000', fontWeight: '400' }}>
                            USDT TRC20
                          </h3>
                          <p className="text-gray-600 mb-0.5" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
                            Fee: 0% Time: Instant
                          </p>
                          <p className="text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
                            Currencies: USDT
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-black ml-3 flex-shrink-0" />
                    </div>
                  );
                })()}
                {/* Other crypto gateways */}
                {cryptoGateways.map(renderGatewayCard)}
              </div>
            </div>

            {/* Bank transfers */}
            {wireGateways.length > 0 && (
              <div className="mb-8">
                <h2 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '400' }}>
                  Bank transfers
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {wireGateways.map(renderGatewayCard)}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-xs text-gray-500" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>
                if you are using a new payment method that was not used before, your deposit might not be applied immediately into your account and might take up to 24 hours to be reviewed and processed. On some occasions we might request a proof that the card or payment account is under your name.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Deposits;
