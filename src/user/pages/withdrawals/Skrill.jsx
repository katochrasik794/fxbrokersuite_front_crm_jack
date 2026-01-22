function Skrill() {
  return (
    <div className="min-h-screen p-4 sm:p-6 overflow-x-hidden" style={{ background: 'linear-gradient(to right, #E5E7EB 0%, #FFFFFF 20%, #FFFFFF 80%, #E5E7EB 100%)' }}>
      <div className="w-full max-w-full sm:max-w-[90%] mx-auto">
        <h1 className="mb-6" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '24px', color: '#000000', fontWeight: '400' }}>
          Withdraw Through Skrill
        </h1>

        {/* Skrill Information Panel */}
        <div className="bg-white rounded-lg p-8 border border-gray-200 text-center">
          {/* Skrill with gray background */}
          <div className="bg-gray-200 rounded-lg p-4 mb-6 flex items-center justify-center">
            <img src="/Skrill_logo.png.webp" alt="Skrill" className="h-20 w-auto mr-10" />
          </div>
          
          <p className="text-center max-w-lg mx-auto" style={{ fontFamily: 'Roboto, sans-serif', fontSize: '14px', color: '#4B5156', fontWeight: '400', lineHeight: '1.6' }}>
            You did not deposit funds using Skrill. Skrill withdrawals are only available to accounts that were previously used for deposits.
          </p>
          </div>
        </div>
    </div>
  )
}

export default Skrill
