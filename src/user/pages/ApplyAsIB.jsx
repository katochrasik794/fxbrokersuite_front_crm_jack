import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import Toast from '../../components/Toast';
import { 
  CheckCircle2, 
  UserCheck, 
  TrendingUp, 
  BarChart3, 
  X, 
  DollarSign, 
  Clock, 
  CheckCircle,
  Briefcase,
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import Swal from 'sweetalert2';

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

        const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api';
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_API_URL || 'https://fxbrokersuite-back-crm-jack.onrender.com/api'}/ib-requests`, {
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
        Swal.fire({
          icon: 'success',
          title: 'Application Submitted',
          text: 'Your IB partnership application has been submitted successfully! We will review it and get back to you soon.',
          confirmButtonColor: '#2563eb'
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
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: data.message || 'Failed to submit application. Please try again.',
          confirmButtonColor: '#2563eb'
        });
      }
    } catch (error) {
      console.error('Error submitting IB application:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'An error occurred. Please try again later.',
        confirmButtonColor: '#2563eb'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
          duration={5000}
        />
      )}

      <PageHeader 
        title="IB Partnership" 
        subtitle="Join our Introducing Broker program and grow your business"
        icon={Briefcase}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* IB Status Banner */}
        {!isLoadingStatus && ibStatus && ibStatus !== 'none' && (
          <div className={`rounded-2xl p-6 shadow-sm border ${
            ibStatus === 'approved'
              ? 'bg-emerald-50 border-emerald-200'
              : ibStatus === 'pending'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-full ${
                ibStatus === 'approved' ? 'bg-emerald-100' : ibStatus === 'pending' ? 'bg-amber-100' : 'bg-red-100'
              }`}>
                {ibStatus === 'approved' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                ) : ibStatus === 'pending' ? (
                  <Clock className="w-6 h-6 text-amber-600" />
                ) : (
                  <X className="w-6 h-6 text-red-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`text-lg font-bold mb-1 ${
                  ibStatus === 'approved' ? 'text-emerald-900' : ibStatus === 'pending' ? 'text-amber-900' : 'text-red-900'
                }`}>
                  {ibStatus === 'approved' 
                    ? 'IB Application Approved' 
                    : ibStatus === 'pending' 
                      ? 'IB Application Under Review' 
                      : 'IB Application Rejected'}
                </h3>
                <p className={`text-sm ${
                  ibStatus === 'approved' ? 'text-emerald-700' : ibStatus === 'pending' ? 'text-amber-700' : 'text-red-700'
                }`}>
                  {ibStatus === 'approved'
                    ? 'Congratulations! Your IB partnership application has been approved. You can now access the Partner\'s Cabinet.'
                    : ibStatus === 'pending'
                      ? 'Your IB partnership application has been submitted and is currently under review. We will notify you once the review is complete.'
                      : 'Your IB partnership application was not approved. Please contact support for more information.'}
                </p>
                
                {ibStatus === 'approved' && (
                  <button
                    onClick={() => navigate('/user/ib/dashboard')}
                    className="mt-4 px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-sm inline-flex items-center gap-2"
                  >
                    Go to Partner's Cabinet
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-sm border border-slate-200">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full -mr-16 -mt-16 blur-3xl opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-50 rounded-full -ml-16 -mb-16 blur-3xl opacity-50"></div>
          
          <div className="relative z-10 grid md:grid-cols-2 gap-8 p-8 md:p-12 items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-medium uppercase tracking-wider">
                <Globe className="w-3 h-3" />
                Global Partner Program
              </div>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight text-slate-900">
                Expand Your Business as an Introducing Broker
              </h1>
              
              <p className="text-slate-600 text-lg max-w-lg leading-relaxed">
                Join our network of successful partners. Earn competitive commissions, access advanced reporting tools, and give your clients the best trading experience.
              </p>
              
              <div className="flex flex-wrap gap-4 pt-2">
                {ibStatus === 'none' || ibStatus === 'rejected' ? (
                  <button
                    onClick={() => setShowApplicationModal(true)}
                    className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 transform hover:-translate-y-0.5"
                  >
                    Become a Partner
                  </button>
                ) : ibStatus === 'approved' ? (
                  <button
                    onClick={() => navigate('/user/ib/dashboard')}
                    className="px-8 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-200 transform hover:-translate-y-0.5"
                  >
                    Partner Dashboard
                  </button>
                ) : (
                  <div className="px-8 py-3.5 bg-slate-100 border border-slate-200 text-slate-400 font-bold rounded-2xl cursor-not-allowed">
                    Application Pending
                  </div>
                )}
              </div>
            </div>
            
            <div className="hidden md:flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-blue-100 rounded-full blur-2xl transform scale-90"></div>
                <div className="relative bg-white/80 backdrop-blur-xl border border-white/50 p-8 rounded-2xl shadow-xl max-w-sm ring-1 ring-slate-100">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-sm text-slate-500">Total Commissions</div>
                      <div className="text-2xl font-bold text-slate-900">$12,450.00</div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-blue-500 rounded-full"></div>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Referrals</span>
                      <span className="font-semibold text-slate-900">24 Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1">Conversion</div>
                        <div className="font-bold text-emerald-500">+18%</div>
                      </div>
                      <div className="bg-slate-50 rounded-2xl p-3 text-center border border-slate-100">
                        <div className="text-xs text-slate-500 mb-1">Volume</div>
                        <div className="font-bold text-blue-600">2.4M</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why Partner Section */}
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: CheckCircle2,
              title: "Simple Setup",
              description: "Zero sign-up fees and a streamlined setup process to get you started immediately.",
              color: "text-emerald-500",
              bg: "bg-emerald-50"
            },
            {
              icon: DollarSign,
              title: "Competitive Payouts",
              description: "Earn lucrative commissions with our competitive and transparent payout structure.",
              color: "text-blue-500",
              bg: "bg-blue-50"
            },
            {
              icon: BarChart3,
              title: "Advanced Tools",
              description: "Access a comprehensive dashboard for real-time monitoring and reporting.",
              color: "text-purple-500",
              bg: "bg-purple-50"
            }
          ].map((item, index) => (
            <div key={index} className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-all group">
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className={`w-7 h-7 ${item.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-600 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>

        {/* Steps Section */}
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-gray-100">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Get Started in 4 Easy Steps
            </h2>
            <p className="text-gray-600">
              Start your journey as an Introducing Broker today. It's fast, easy, and free to join.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { number: "01", title: "Sign Up", desc: "Complete the simple application form.", icon: UserCheck },
              { number: "02", title: "Get Approved", desc: "We review your application quickly.", icon: ShieldCheck },
              { number: "03", title: "Refer Clients", desc: "Introduce traders to our platform.", icon: Globe },
              { number: "04", title: "Earn Commission", desc: "Receive payouts for client activity.", icon: DollarSign },
            ].map((step, index) => (
              <div key={index} className="relative group">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-4xl font-black text-gray-100 group-hover:text-blue-50 transition-colors">
                    {step.number}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <step.icon className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 rounded-t-3xl">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Partner Application</h3>
                <p className="text-sm text-gray-500">Tell us about your experience</p>
              </div>
              <button
                onClick={() => setShowApplicationModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
              {/* IB Experience */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  IB Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="ibExperience"
                  value={formData.ibExperience}
                  onChange={handleInputChange}
                  placeholder="Please describe your experience as an Introducing Broker..."
                  rows={4}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none ${
                    errors.ibExperience ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                />
                {errors.ibExperience && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> {errors.ibExperience}
                  </p>
                )}
              </div>

              {/* Previous Clients Count */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Previous Client Base <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    name="previousClientsCount"
                    value={formData.previousClientsCount}
                    onChange={handleInputChange}
                    placeholder="Approximate number of active clients"
                    min="0"
                    className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all ${
                      errors.previousClientsCount ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <UserCheck className="w-5 h-5" />
                  </div>
                </div>
                {errors.previousClientsCount && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> {errors.previousClientsCount}
                  </p>
                )}
              </div>

              {/* Willing to become IB */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Are you willing to become an IB with fxbrokersuite Partners? <span className="text-red-500">*</span>
                </label>
                <select
                  name="willingToBecomeIB"
                  value={formData.willingToBecomeIB}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none ${
                    errors.willingToBecomeIB ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes, I am interested</option>
                  <option value="no">No, maybe later</option>
                </select>
                {errors.willingToBecomeIB && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> {errors.willingToBecomeIB}
                  </p>
                )}
              </div>

              {/* Willing to sign agreement */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700">
                  Are you willing to sign the IB Agreement? <span className="text-red-500">*</span>
                </label>
                <select
                  name="willingToSignAgreement"
                  value={formData.willingToSignAgreement}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all appearance-none ${
                    errors.willingToSignAgreement ? 'border-red-500 bg-red-50/50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <option value="">Select an option</option>
                  <option value="yes">Yes, I agree to sign</option>
                  <option value="no">No, I do not agree</option>
                </select>
                {errors.willingToSignAgreement && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <X className="w-3 h-3" /> {errors.willingToSignAgreement}
                  </p>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowApplicationModal(false)}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-all shadow-lg hover:shadow-blue-500/30 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Application
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApplyAsIB;
