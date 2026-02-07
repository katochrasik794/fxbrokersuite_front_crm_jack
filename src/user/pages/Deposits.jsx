import { useState, useEffect } from 'react';
import { ChevronRight, ArrowDownToLine, AlertCircle, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import authService from '../../services/auth.js';
import PageHeader from '../components/PageHeader.jsx';

const API_BASE_URL = import.meta.env.VITE_BACKEND_API_URL || import.meta.env.VITE_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';
const BACKEND_URL = import.meta.env.VITE_BACKEND_API_URL?.replace('/api', '') || import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://fxbrokersuite-back-crm-jack.onrender.com';

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

  const recommendedGateways = gateways.filter(g => g.is_recommended);
  const cryptoGateways = gateways.filter(g => g.type === 'crypto' && !g.is_recommended);
  const wireGateways = gateways.filter(g => g.type === 'wire');
  const otherGateways = gateways.filter(g => !g.is_recommended && g.type !== 'crypto' && g.type !== 'wire');

  const getFullUrl = (url) => {
    if (!url) return null;
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';

    if (url.startsWith('http')) {
      if (!isLocalhost && (url.includes('localhost') || url.includes('127.0.0.1'))) {
        return url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
      }
      return url;
    }

    if (BACKEND_URL && !BACKEND_URL.includes('localhost') && !BACKEND_URL.includes('127.0.0.1')) {
      return `${BACKEND_URL}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    if (isLocalhost) {
      const localBase = BACKEND_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com';
      return `${localBase}${url.startsWith('/') ? '' : '/'}${url}`;
    }

    return url.startsWith('/') ? url : `/${url}`;
  };

  const renderGatewayCard = (gateway) => (
    <div
      key={gateway.id}
      onClick={() => handleGatewayClick(gateway)}
      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer flex items-center justify-between group"
    >
      <div className="flex items-center flex-1">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100 group-hover:bg-white transition-colors">
          {gateway.icon_url ? (
            <img
              src={getFullUrl(gateway.icon_url)}
              alt={gateway.name}
              className="w-full h-full object-contain p-2"
              onError={(e) => {
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.parentNode.innerHTML = '<div class="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">IMG</div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-medium">N/A</div>
          )}
        </div>
        <div className="flex-1">
          <h3 className="text-gray-900 font-bold text-base mb-1 group-hover:text-blue-600 transition-colors">
            {gateway.name}
          </h3>
          <p className="text-gray-500 text-xs font-medium mb-1">
            Fee: <span className="text-green-600">0%</span> • Time: {gateway.type === 'wire' ? '1-3 days' : 'Instant'}
          </p>
          <p className="text-gray-400 text-xs">
            Currencies: USD, EUR, GBP & more
          </p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {/* Loading State Overlay */}
      {kycLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 font-medium">Checking verification status...</p>
          </div>
        </div>
      )}

      {/* KYC Block Overlay */}
      {!kycLoading && !isKYCApproved && (
        <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg border border-gray-100 text-center transform transition-all scale-100">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-50 mb-6">
              <ShieldCheck className="h-8 w-8 text-yellow-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Verification Required
            </h2>
            
            <p className="text-gray-500 mb-8 leading-relaxed">
              To proceed with deposits, please complete your identity verification (KYC). This helps us ensure the security of your account and comply with regulations.
            </p>
            
            <button
              onClick={() => navigate('/user/verification')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 px-6 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98]"
            >
              Complete Verification
            </button>
          </div>
        </div>
      )}

      <div className={`space-y-8 ${!isKYCApproved && !kycLoading ? 'opacity-20 pointer-events-none blur-sm' : ''}`}>
        <PageHeader
          icon={ArrowDownToLine}
          title="Deposit Funds"
          subtitle="Choose your preferred payment method to fund your trading account."
        />

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
            <p className="mt-4 text-gray-500 font-medium">Loading payment methods...</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Recommended methods */}
            {recommendedGateways.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                  Recommended Methods
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {recommendedGateways.map(renderGatewayCard)}
                </div>
              </div>
            )}

            {/* Additional Payment Methods */}
            {otherGateways.length > 0 && (
              <div>
                <div className="mb-4">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
                    Additional Methods
                  </h2>
                  <p className="text-sm text-gray-500 mt-1 ml-3.5">
                    Explore more ways to fund your account securely.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {otherGateways.map(renderGatewayCard)}
                </div>
              </div>
            )}

            {/* Cryptocurrencies */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                Cryptocurrencies
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {/* Static USDT TRC20 Card */}
                {(() => {
                  const usdtGateway = gateways.find(g => g.name?.toLowerCase().includes('usdt') && g.name?.toLowerCase().includes('trc20'));
                  const logoUrl = getFullUrl(usdtGateway?.icon_url) || '/tether.svg';
                  return (
                    <div
                      onClick={() => navigate('/user/deposits/cregis-usdt-trc20')}
                      className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center flex-1">
                        <div className="w-16 h-16 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden bg-gray-50 border border-gray-100 group-hover:bg-white transition-colors">
                          <img src={logoUrl} alt="USDT TRC20" className="w-full h-full object-contain p-2" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-gray-900 font-bold text-base mb-1 group-hover:text-blue-600 transition-colors">
                            USDT TRC20
                          </h3>
                          <p className="text-gray-500 text-xs font-medium mb-1">
                            Fee: <span className="text-green-600">0%</span> • Time: Instant
                          </p>
                          <p className="text-gray-400 text-xs">
                            Currencies: USDT
                          </p>
                        </div>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  );
                })()}
                {cryptoGateways.map(renderGatewayCard)}
              </div>
            </div>

            {/* Bank transfers */}
            {wireGateways.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                  Bank Transfers
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                  {wireGateways.map(renderGatewayCard)}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
              <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-blue-800 leading-relaxed font-medium">
                Note: If you are using a new payment method that was not used before, your deposit might not be applied immediately and could take up to 24 hours to be reviewed. We may request proof of ownership for the payment method used.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Deposits;
