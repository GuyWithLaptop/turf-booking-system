import PublicTimeSlots from '@/components/PublicTimeSlots';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50 to-teal-50">
      {/* Header */}
      <header className="bg-white shadow-md border-b-4 border-emerald-500">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
            FS Sports Club
          </h1>
          <p className="text-gray-600 mt-2 text-lg">Premium Sports Turf Facility</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Time Slots Section */}
        <div className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              Available Time Slots
            </h2>
            <p className="text-gray-600 text-lg">
              View real-time availability and book by calling us
            </p>
          </div>
          
          <PublicTimeSlots />
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all border-2 border-transparent hover:border-emerald-300">
            <div className="text-5xl mb-4">⚽</div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Premium Quality</h4>
            <p className="text-gray-600 text-sm">
              High-quality artificial turf perfect for all sports
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all border-2 border-transparent hover:border-emerald-300">
            <div className="text-5xl mb-4">🌙</div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Floodlights</h4>
            <p className="text-gray-600 text-sm">
              Play day or night with our professional lighting
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6 text-center transform hover:scale-105 transition-all border-2 border-transparent hover:border-emerald-300">
            <div className="text-5xl mb-4">🏆</div>
            <h4 className="font-bold text-lg mb-2 text-gray-800">Easy Booking</h4>
            <p className="text-gray-600 text-sm">
              Simple phone booking process with instant confirmation
            </p>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="bg-gradient-to-r from-white to-gray-50 rounded-xl shadow-lg p-8 mt-12 border-l-4 border-emerald-500">
          <h4 className="font-bold text-xl mb-4 text-gray-800">Operating Hours</h4>
          <p className="text-gray-700 text-lg">
            <span className="font-semibold text-emerald-600">Daily:</span> 24 Hours - Open All Day!
          </p>
          <p className="text-gray-600 mt-2">
            All days of the week including holidays
          </p>
          <p className="text-emerald-600 font-medium mt-3">
            • 1-hour slots available round the clock
          </p>
          <p className="text-emerald-600 font-medium">
            • 24 slots per day for maximum flexibility
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white mt-16 py-8 border-t-4 border-emerald-500">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-300 font-medium">
            © {new Date().getFullYear()} FS Sports Club. All rights reserved.
          </p>
          <p className="text-gray-400 text-sm mt-2">
            Premium Sports Turf Facility
          </p>
        </div>
      </footer>
    </div>
  );
}
