import { FileText, Shield, Scale, AlertTriangle, MessageSquare, Cookie, Lock, FileCheck, Users, AlertOctagon, Globe, ArrowRight, BookOpen } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'

function Legal() {
  const legalLinks = [
    { 
      title: 'Terms and Conditions for Swap Free accounts', 
      content: 'Terms and conditions governing swap-free trading accounts.',
      icon: FileCheck
    },
    { 
      title: 'Payments Terms and Conditions', 
      content: 'Terms and conditions for all payment transactions and methods.',
      icon: FileText
    },
    { 
      title: 'Order Execution Policy', 
      content: 'Policy outlining how orders are executed and processed.',
      icon: Scale
    },
    { 
      title: 'Risk Warning Disclosure', 
      content: 'Important risk warnings regarding trading activities.',
      icon: AlertTriangle
    },
    { 
      title: 'Client Complaints Handling Procedure', 
      content: 'Procedure for handling and resolving client complaints.',
      icon: MessageSquare
    },
    { 
      title: 'Cookies Policy', 
      content: 'Information about how we use cookies on our website.',
      icon: Cookie
    },
    { 
      title: 'Privacy Policy', 
      content: 'How we collect, use, and protect your personal information.',
      icon: Lock
    },
    { 
      title: 'Terms and Conditions', 
      content: 'General terms and conditions for using our services.',
      icon: FileText
    },
    { 
      title: 'Clients Agreement', 
      content: 'Agreement between the client and fxbrokersuite Brokerage.',
      icon: Users
    },
    { 
      title: 'Conflicts of Interest Policy', 
      content: 'Policy regarding potential conflicts of interest.',
      icon: AlertOctagon
    },
    { 
      title: 'Terms of Use', 
      content: 'Terms governing the use of our website and platform.',
      icon: Globe
    },
    { 
      title: 'Website Acceptable Use Policy', 
      content: 'Rules and guidelines for acceptable use of our website.',
      icon: Shield
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 transition-colors duration-300">
      <div className="max-w-7xl mx-auto space-y-8">
        <PageHeader
          icon={BookOpen}
          title="Legal Terms and Policies"
          subtitle="Review our legal documents, terms, and policies that govern your use of our services."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {legalLinks.map((item, index) => {
            const Icon = item.icon
            return (
              <a
                key={index}
                href="#"
                className="group block bg-white/80 backdrop-blur-md rounded-2xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md hover:border-blue-200 hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-slate-50 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300">
                    <Icon className="w-6 h-6 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-1 transition-all duration-300" />
                </div>
                
                <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-blue-700 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {item.content}
                </p>
              </a>
            )
          })}
        </div>

        {/* Disclaimer Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl border border-slate-200/60 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Risk Warning & Disclaimer
              </h2>
              <div className="text-sm text-slate-600 space-y-3 leading-relaxed">
                <p>
                  fxbrokersuite Brokerage (Seychelles) Limited is a registered trading name in Seychelles (License Number SD064) which is authorized and regulated by the Financial Services Authority with its company address at First Floor, Marina House, Eden Island, Republic of Seychelles.
                </p>
                <p>
                  Trading in financial instruments involves significant risk and may not be suitable for all investors. Before trading, please ensure you understand the risks involved and seek independent advice if necessary.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="flex items-center justify-between bg-blue-600 rounded-2xl p-6 sm:p-8 text-white shadow-lg shadow-blue-200">
          <div>
            <h3 className="text-xl font-bold mb-2">
              Have questions about our policies?
            </h3>
            <p className="text-blue-100 text-sm max-w-xl">
              Our support team is available 24/7 to assist you with any inquiries regarding our legal terms and conditions.
            </p>
          </div>
          <button className="px-6 py-2.5 bg-white text-blue-600 rounded-xl font-semibold text-sm hover:bg-blue-50 transition-colors shadow-sm">
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}

export default Legal
