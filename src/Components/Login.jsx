import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

const Login = () => {
  const [userId, setUserId] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    if (!userId || !password) {
      setError('Please fill in both fields')
      return
    }

    setLoading(true)

    const { data, error: queryError } = await supabase
      .from('public.users')
      .select('*')
      .eq('email', userId)
      .eq('github_username', password)
      .single()

    setLoading(false)

    if (queryError || !data) {
      setError('Invalid User ID or Password')
      return
    }

    // Login success — replace with your routing/session logic
    console.log('Logged in as:', data.user)
  }

  return (
    <div className='max-w-[90%] md:w-sm m-auto bg-black/60 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl shadow-black/50 flex flex-col text-white p-6'>
      <h1 className='m-auto p-1 text-3xl text-green-300 font-semibold tracking-tight'>
        Welcome Back
      </h1>
      <p className='m-auto text-emerald-500/80 text-sm mb-4'>
        Log in to your account
      </p>

      <form className='p-1 flex flex-col gap-4' onSubmit={handleLogin}>
        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-300'>User ID</label>
          <div className='relative flex items-center'>
            <i className='ri-user-line absolute left-3 text-gray-400' />
            <input
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder='Enter your Email ID'
              className='w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-3 py-2 text-sm
                         placeholder:text-gray-500 outline-none
                         focus:border-green-400 focus:ring-1 focus:ring-green-400/50
                         transition-colors'
            />
          </div>
        </div>

        <div className='flex flex-col gap-1'>
          <label className='text-sm text-gray-300'>Password</label>
          <div className='relative flex items-center'>
            <i className='ri-lock-line absolute left-3 text-gray-400' />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your Password'
              type={showPassword ? 'text' : 'password'}
              className='w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-10 py-2 text-sm
                         placeholder:text-gray-500 outline-none
                         focus:border-green-400 focus:ring-1 focus:ring-green-400/50
                         transition-colors'
            />
            <button
              type='button'
              onClick={() => setShowPassword(!showPassword)}
              className='absolute right-3 text-gray-400 hover:text-gray-200'
            >
              <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
            </button>
          </div>
        </div>

        {error && (
          <p className='text-red-400 text-sm -mt-1'>{error}</p>
        )}

        <a className='text-xs text-emerald-500 hover:text-emerald-400 self-end cursor-pointer'>
          Forgot Password?
        </a>

        <button
          type='submit'
          disabled={loading}
          className='w-full bg-gradient-to-r from-green-700 to-emerald-600 hover:from-green-600 hover:to-emerald-500
                     disabled:opacity-60 disabled:cursor-not-allowed
                     p-2 rounded-lg font-medium transition-all shadow-lg shadow-green-900/40'
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>

      </form>
    </div>
  )
}

export default Login