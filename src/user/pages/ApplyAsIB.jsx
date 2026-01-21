import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../ib-portal/ui/Button';
import Toast from '../../components/Toast';
import { CheckCircle2, UserCheck, TrendingUp, BarChart3, X, DollarSign, Clock, CheckCircle } from 'lucide-react';

function ApplyAsIB() {
  const navigate = useNavigate();
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [formData, setFormData] = useState({
    ibExperience: '',
    previousClientsCount: '',
    willingToBecomeIB: '',
    willingToSignAgreement: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [ibStatus, setIbStatus] = useState(null); // null = loading, 'pending' = pending, 'approved' = approved, 'rejected' = rejected, 'none' = no application
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Fetch IB status on mount
  useEffect(() => {
    const fetchIBStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setIbStatus('none');
          setIsLoadingStatus(false);
          return;
        }

        const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api';
        const response = await fetch(`${API_BASE_URL}/ib-requests/status`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            if (data.data.status === 'approved') {
              setIbStatus('approved');
            } else if (data.data.status === 'pending') {
              setIbStatus('pending');
            } else if (data.data.status === 'rejected') {
              setIbStatus('rejected');
            } else {
              setIbStatus('none');
            }
          } else {
            setIbStatus('none');
          }
        } else {
          setIbStatus('none');
        }
      } catch (error) {
        console.error('Error fetching IB status:', error);
        setIbStatus('none');
      } finally {
        setIsLoadingStatus(false);
      }
    };

    fetchIBStatus();
  }, []);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.ibExperience.trim()) {
      newErrors.ibExperience = 'Please describe your IB experience';
    }

    if (!formData.previousClientsCount.trim()) {
      newErrors.previousClientsCount = 'Please enter approximate number of clients';
    } else if (isNaN(formData.previousClientsCount) || parseInt(formData.previousClientsCount) < 0) {
      newErrors.previousClientsCount = 'Please enter a valid number';
    }

    if (!formData.willingToBecomeIB) {
      newErrors.willingToBecomeIB = 'Please select an option';
    }

    if (!formData.willingToSignAgreement) {
      newErrors.willingToSignAgreement = 'Please select an option';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'http://localhost:5000/api'}/ib-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ib_experience: formData.ibExperience,
          previous_clients_count: parseInt(formData.previousClientsCount),
          willing_to_become_ib: formData.willingToBecomeIB,
          willing_to_sign_agreement: formData.willingToSignAgreement,
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setShowApplicationModal(false);
        setToast({
          message: 'Your IB partnership application has been submitted successfully! We will review it and get back to you soon.',
          type: 'success'
        });
        setFormData({
          ibExperience: '',
          previousClientsCount: '',
          willingToBecomeIB: '',
          willingToSignAgreement: '',
        });
        // Refresh IB status
        setIbStatus('pending');
      } else {
        setToast({
          message: data.message || 'Failed to submit application. Please try again.',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Error submitting IB application:', error);
      setToast({
        message: 'An error occurred. Please try again later.',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      {/* IB Status Banner - Show if application exists */}
      {!isLoadingStatus && ibStatus && ibStatus !== 'none' && (
        <div className={`mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-xl shadow-lg ${ibStatus === 'approved'
            ? 'bg-green-50 border-2 border-green-500'
            : ibStatus === 'pending'
              ? 'bg-yellow-50 border-2 border-yellow-500'
              : 'bg-red-50 border-2 border-red-500'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
            <div className="flex items-center gap-3 sm:gap-4">
              {ibStatus === 'approved' ? (
                <>
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-green-900 mb-1">
                      IB Application Approved
                    </h3>
                    <p className="text-sm sm:text-base text-green-700">
                      Congratulations! Your IB partnership application has been approved. You can now access the Partner's Cabinet from the menu.
                    </p>
                  </div>
                </>
              ) : ibStatus === 'pending' ? (
                <>
                  <div className="flex-shrink-0">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-yellow-900 mb-1">
                      IB Application Under Review
                    </h3>
                    <p className="text-sm sm:text-base text-yellow-700">
                      Your IB partnership application has been submitted and is currently under review. We will notify you once the review is complete.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex-shrink-0">
                    <X className="w-6 h-6 sm:w-8 sm:h-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base sm:text-lg font-bold text-red-900 mb-1">
                      IB Application Rejected
                    </h3>
                    <p className="text-sm sm:text-base text-red-700">
                      Your IB partnership application was not approved. Please contact support for more information.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Top Banner Section */}
      <div className="relative bg-gradient-to-r from-purple-900 via-purple-800 to-green-500 overflow-hidden mx-2 sm:mx-4 mt-2 sm:mt-4 rounded-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-6 items-center">
            {/* Left Side - Text */}
            <div className="text-white z-10 order-2 md:order-1">
              <div className="mb-1">
                <span className="text-xs sm:text-sm font-medium text-green-300 uppercase tracking-wide">Become a Partner</span>
              </div>
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2 leading-tight">
                Become an Introducing Broker & Expand Your Own Business
              </h1>
              <p className="text-xs sm:text-sm text-green-100 mb-2 sm:mb-3">
                Opportunity to grow and earn more with us.
              </p>
              {ibStatus === 'none' || ibStatus === 'rejected' ? (
                <Button
                  onClick={() => setShowApplicationModal(true)}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 text-xs sm:text-sm font-semibold"
                >
                  Become a Partner
                </Button>
              ) : ibStatus === 'approved' ? (
                <Button
                  onClick={() => navigate('/user/ib/dashboard')}
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-black px-4 py-2 text-xs sm:text-sm font-semibold"
                >
                  Go to Partner's Cabinet
                </Button>
              ) : (
                <div className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-xs sm:text-sm font-semibold border border-yellow-300">
                  Application Under Review
                </div>
              )}
            </div>

            {/* Right Side - Illustration */}
            <div className="relative z-10 flex justify-center items-center order-1 md:order-2">
              <div className="relative w-full max-w-[180px] sm:max-w-[220px] md:max-w-[280px]">
                <img
                  src="/partner-banner.png"
                  alt="IB Partner"
                  className="w-full h-auto object-contain max-h-28 sm:max-h-36 md:max-h-44"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className="hidden w-full h-28 sm:h-36 md:h-44 bg-gray-200 rounded-lg flex items-center justify-center">
                  <UserCheck className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-24 h-24 sm:w-32 sm:h-32 bg-green-400 opacity-20 rounded-full blur-2xl -mr-12 sm:-mr-16 -mt-12 sm:-mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 bg-purple-400 opacity-20 rounded-full blur-2xl -ml-12 sm:-ml-16 -mb-12 sm:-mb-16"></div>
      </div>

      {/* Why Partner Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
            Why Partner with Us?
          </h2>
          <p className="text-lg sm:text-xl text-gray-700 font-medium mb-4">
            Become an IB to earn additional income by referring clients to Solitaire Partners.
          </p>
          <p className="text-gray-500 leading-relaxed text-base sm:text-lg">
            We offer our partners the ultimate transparency and seamless experience! Join us to access the most advanced trading tools and benefit from the highest levels of security and customer service.
          </p>
        </div>

        {/* Advantages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">Zero sign-up fees and super simple set-up process</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
              <DollarSign className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">Lucrative and competitive commission payouts</p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center text-center group">
            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-green-100 transition-colors">
              <BarChart3 className="w-7 h-7 text-green-600" />
            </div>
            <p className="text-gray-900 font-semibold text-lg">Advanced dashboard and tools for close monitoring</p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          {ibStatus === 'none' || ibStatus === 'rejected' ? (
            <Button
              onClick={() => setShowApplicationModal(true)}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 text-base font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5 transition-all"
            >
              Become a Partner
            </Button>
          ) : ibStatus === 'approved' ? (
            <Button
              onClick={() => navigate('/user/ib/dashboard')}
              size="lg"
              className="bg-green-500 hover:bg-green-600 text-black px-8 py-3 text-base font-bold shadow-lg shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-0.5 transition-all"
            >
              Go to Partner's Cabinet
            </Button>
          ) : (
            <div className="inline-flex items-center px-6 py-3 bg-yellow-100 text-yellow-800 rounded-xl text-base font-semibold border border-yellow-300">
              Application Under Review
            </div>
          )}
        </div>
      </div>

      {/* Get Started Section */}
      <div className="bg-white py-3 sm:py-4 md:py-5 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-3 text-center">
            Get Started Now in Few Steps
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-gray-600 mb-4 sm:mb-6 text-center max-w-3xl mx-auto">
            Being an Introducing Broker with us can be a lucrative opportunity for individuals or companies who have an existing network of potential clients in the financial industry.
          </p>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 max-w-6xl mx-auto">
            {[
              { number: 1, title: 'Promote Solitaire Partners and attract traders.', icon: TrendingUp },
              { number: 2, title: 'Introduce your clients to Solitaire Partners.', icon: UserCheck },
              { number: 3, title: 'Gain profit when your referral joins us.', icon: BarChart3 },
              { number: 4, title: 'Use the partner portal for monitoring.', icon: TrendingUp },
            ].map((step, index) => (
              <div
                key={index}
                className="bg-white border-t-4 border-green-500 rounded-lg shadow-md p-3 sm:p-4 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black text-white rounded-full flex items-center justify-center font-bold text-sm sm:text-base flex-shrink-0">
                    {step.number}
                  </div>
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <step.icon className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  </div>
                </div>
                <p className="text-xs sm:text-sm md:text-base text-gray-700 leading-relaxed">{step.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-black text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between sticky top-0 z-10">
              <h3 className="text-lg sm:text-xl font-semibold">IB Partnership Application</h3>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
              {/* IB Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IB Experience
                </label>
                <textarea
                  name="ibExperience"
                  value={formData.ibExperience}
                  onChange={handleInputChange}
                  placeholder="Describe your IB experience"
                  rows={4}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${errors.ibExperience ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.ibExperience && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.ibExperience}</p>
                )}
              </div>

              {/* Previous Clients Count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many IB clients you have with your previous partner?
                </label>
                <input
                  type="number"
                  name="previousClientsCount"
                  value={formData.previousClientsCount}
                  onChange={handleInputChange}
                  placeholder="Approximate number of clients"
                  min="0"
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${errors.previousClientsCount ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.previousClientsCount && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.previousClientsCount}</p>
                )}
              </div>

              {/* Willing to become IB */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you willing to become an IB with Solitaire Partners?
                </label>
                <select
                  name="willingToBecomeIB"
                  value={formData.willingToBecomeIB}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${errors.willingToBecomeIB ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.willingToBecomeIB && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.willingToBecomeIB}</p>
                )}
              </div>

              {/* Willing to sign agreement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Are you willing to sign IB Agreement with Solitaire Partners?
                </label>
                <select
                  name="willingToSignAgreement"
                  value={formData.willingToSignAgreement}
                  onChange={handleInputChange}
                  className={`w-full px-3 sm:px-4 py-2 sm:py-3 border-2 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all text-sm sm:text-base ${errors.willingToSignAgreement ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
                {errors.willingToSignAgreement && (
                  <p className="mt-1 text-xs sm:text-sm text-red-600">{errors.willingToSignAgreement}</p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setShowApplicationModal(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="dark"
                  disabled={isSubmitting}
                  className="bg-black hover:bg-gray-900 text-white w-full sm:w-auto"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplyAsIB;
