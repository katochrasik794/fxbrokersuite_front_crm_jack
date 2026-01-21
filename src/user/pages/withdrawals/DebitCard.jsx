function DebitCard() {
  return (
    <div className="min-h-screen p-4 sm:p-6 overflow-x-hidden" style={{ background: 'linear-gradient(to right, #E5E7EB 0%, #FFFFFF 20%, #FFFFFF 80%, #E5E7EB 100%)' }}>
      <div className="w-full max-w-full sm:max-w-[80%] mx-auto">
        <h1 className="mb-4" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '400' }}>
          Withdraw Using Your Debit or Credit Card
        </h1>

        {/* Card Logos and Information */}
        <div className="bg-white rounded-lg p-6 mb-6 border border-gray-200 text-center">
          {/* Card Logos */}
          <div className="flex items-center justify-center gap-4 sm:gap-8 mb-6">
            {/* VISA */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-12 bg-blue-600 rounded flex items-center justify-center mb-2">
                <span className="text-white font-bold text-xl" style={{ fontFamily: 'Roboto, sans-serif', fontWeight: '700' }}>VISA</span>
              </div>
            </div>
            
            {/* Mastercard */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-12 flex items-center justify-center mb-2 relative">
                <div className="relative" style={{ width: '50px', height: '30px' }}>
                  <div className="absolute w-7 h-7 bg-red-500 rounded-full" style={{ left: '0px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}></div>
                  <div className="absolute w-7 h-7 bg-orange-500 rounded-full" style={{ left: '7px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}></div>
                </div>
              </div>
              <span className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>mastercard</span>
            </div>
            
            {/* Maestro */}
            <div className="flex flex-col items-center">
              <div className="w-20 h-12 flex items-center justify-center mb-2 relative">
                <div className="relative" style={{ width: '50px', height: '30px' }}>
                  <div className="absolute w-7 h-7 bg-red-500 rounded-full" style={{ left: '0px', top: '50%', transform: 'translateY(-50%)', zIndex: 1 }}></div>
                  <div className="absolute w-7 h-7 bg-blue-500 rounded-full" style={{ left: '7px', top: '50%', transform: 'translateY(-50%)', zIndex: 2 }}></div>
                </div>
              </div>
              <span className="text-xs text-gray-600" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '12px', fontWeight: '400' }}>maestro</span>
            </div>
          </div>

          {/* Information Text */}
          <div className="space-y-4">
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#4B5156', fontWeight: '400', lineHeight: '1.5' }}>
              Solitaire follows a strict return to source policy, in all instances where applicable, all monies paid out by Solitaire will be paid back to the source from where they originated from.
            </p>
            <p style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#4B5156', fontWeight: '400', lineHeight: '1.5' }}>
              To make a withdrawal to a card, a deposit must first be made from a card and the details must be saved on this platform.
            </p>
          </div>
          </div>
        </div>
    </div>
  )
}

export default DebitCard
