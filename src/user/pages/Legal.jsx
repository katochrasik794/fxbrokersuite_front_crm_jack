function Legal() {
  const legalLinks = [
    { title: 'Terms and Conditions for Swap Free accounts', content: 'Terms and conditions governing swap-free trading accounts.' },
    { title: 'Payments Terms and Conditions', content: 'Terms and conditions for all payment transactions and methods.' },
    { title: 'Order Execution Policy', content: 'Policy outlining how orders are executed and processed.' },
    { title: 'Risk Warning Disclosure', content: 'Important risk warnings regarding trading activities.' },
    { title: 'Client Complaints Handling Procedure', content: 'Procedure for handling and resolving client complaints.' },
    { title: 'Cookies Policy', content: 'Information about how we use cookies on our website.' },
    { title: 'Privacy Policy', content: 'How we collect, use, and protect your personal information.' },
    { title: 'Terms and Conditions', content: 'General terms and conditions for using our services.' },
    { title: 'Clients Agreement', content: 'Agreement between the client and fxbrokersuite Brokerage.' },
    { title: 'Conflicts of Interest Policy', content: 'Policy regarding potential conflicts of interest.' },
    { title: 'Terms of Use', content: 'Terms governing the use of our website and platform.' },
    { title: 'Website Acceptable Use Policy', content: 'Rules and guidelines for acceptable use of our website.' }
  ]

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 overflow-x-hidden pb-20">
      <div className="max-w-4xl mx-auto w-full">
        {/* Heading */}
        <h1 className="text-center text-3xl font-bold mb-8" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '32px', color: '#000000', fontWeight: '700' }}>
          Legal Terms and Policies
        </h1>

        {/* Introduction */}
        <div className="mb-8">
          <p className="text-gray-700 text-center" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', fontWeight: '400', lineHeight: '1.6' }}>
            Please review our legal documents and policies below. These documents govern your use of our services and outline important terms, conditions, and policies.
          </p>
        </div>

        {/* Legal Links List */}
        <div className="space-y-4 mb-8">
          {legalLinks.map((item, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-b-0">
              <h3 className="font-semibold mb-2" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '18px', color: '#000000', fontWeight: '600' }}>
                {item.title}
              </h3>
              <p className="text-gray-600 mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '1.6' }}>
                {item.content}
              </p>
              <a
                href="#"
                className="text-black hover:underline font-medium"
                style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '500', color: '#000000' }}
              >
                Read More →
              </a>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-8"></div>

        {/* Disclaimer Section */}
        <div className="mb-8">
          <h2 className="font-bold mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '20px', color: '#000000', fontWeight: '700' }}>
            Trading involves a high degree of risk
          </h2>
          <p className="text-gray-700 mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '1.6' }}>
            fxbrokersuite Brokerage (Seychelles) Limited is a registered trading name in Seychelles (License Number SD064) which is authorized and regulated by the Financial Services Authority with its company address at First Floor, Marina House, Eden Island, Republic of Seychelles.
          </p>
          <p className="text-gray-700" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '1.6' }}>
            Trading in financial instruments involves significant risk and may not be suitable for all investors. Before trading, please ensure you understand the risks involved and seek independent advice if necessary.
          </p>
        </div>

        {/* Contact Information */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="font-semibold mb-3" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '16px', color: '#000000', fontWeight: '600' }}>
            Contact Us
          </h3>
          <p className="text-gray-700" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', fontWeight: '400', lineHeight: '1.6' }}>
            If you have any questions about our legal terms and policies, please contact our support team.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Legal
