function UserHome() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-neutral-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <h1 className="text-4xl font-bold text-brand-600 mb-2">
              User Dashboard
            </h1>
            <p className="text-gray-600">
              Welcome to the User Side
            </p>
          </header>

          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">
              User Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Profile</h3>
                <p className="text-sm text-gray-600">Manage your profile settings</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Dashboard</h3>
                <p className="text-sm text-gray-600">View your dashboard</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserHome

