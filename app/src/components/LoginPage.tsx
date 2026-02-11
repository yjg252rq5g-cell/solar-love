import { useState } from 'react'
import { useStore } from '@/lib/store'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const setLoggedIn = useStore(s => s.setLoggedIn)

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-navy rounded-2xl text-white text-2xl font-extrabold mb-4">
            AS
          </div>
          <h1 className="text-2xl font-extrabold text-navy">AKINO SOLAR</h1>
          <p className="text-sm text-gray-500 mt-1">Command Center v4.0</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <form onSubmit={(e) => { e.preventDefault(); setLoggedIn(true) }}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="caden@akinosolar.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-navy text-white rounded-lg font-semibold text-sm hover:bg-navy-dark transition-colors cursor-pointer"
            >
              Sign In
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={() => setLoggedIn(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Enter Demo Mode
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Generac Authorized Service Provider &bull; Knoxville, TN
        </p>
      </div>
    </div>
  )
}
