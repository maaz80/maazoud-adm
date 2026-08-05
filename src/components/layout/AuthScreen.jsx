import React from 'react';
import { FiLock } from 'react-icons/fi';

export default function AuthScreen({
  authLoading,
  user,
  authError,
  authSuccessMsg,
  loginStep,
  setLoginStep,
  loginEmail,
  setLoginEmail,
  loginOtp,
  setLoginOtp,
  handleSendOtp,
  handleVerifyOtp,
  setAuthError,
  setAuthSuccessMsg
}) {
  if (authLoading && !user) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-stone-300 border-t-[#8c6239] rounded-full animate-spin"></div>
          <span className="text-xs text-stone-400 uppercase tracking-widest">Checking authorization...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-stone-100 p-4 relative font-sans">
      <div className="absolute inset-0 bg-stone-900/5 backdrop-blur-sm z-0" />

      <div className="relative bg-white rounded-lg max-w-sm w-full shadow-2xl border border-stone-200 p-8 space-y-6 z-10">
        <div className="text-center space-y-2">
          <span className="text-2xl font-bold tracking-[0.25em] text-stone-950 block">MAAZ OUD</span>
          <span className="text-[9px] tracking-[0.4em] text-[#8c6239] uppercase font-bold block">Admin Dashboard</span>

          <div className="w-12 h-12 rounded-full bg-stone-50 border border-stone-200 flex items-center justify-center mx-auto text-[#8c6239] shadow-sm mt-4">
            <FiLock size={20} />
          </div>
          <h2 className="text-xs font-bold text-stone-900 uppercase tracking-widest pt-2">
            Authentication Required
          </h2>
          <p className="text-[10px] text-stone-400 font-light leading-normal">
            Only authorized administrators can log in to update catalog and manage order records.
          </p>
        </div>

        {authError && (
          <div className="p-3 bg-red-50 border border-red-100 text-red-700 text-[10px] rounded text-center leading-normal">
            {authError}
          </div>
        )}
        {authSuccessMsg && (
          <div className="p-3 bg-green-50 border border-green-100 text-green-700 text-[10px] rounded text-center leading-normal">
            {authSuccessMsg}
          </div>
        )}

        {loginStep === 'email' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                Administrator Email
              </label>
              <input
                type="email"
                required
                placeholder="Enter administrator email..."
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded py-2.5 px-3 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow cursor-pointer"
            >
              Send Verification Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="block text-[9px] font-bold text-stone-700 uppercase tracking-wider mb-1">
                6-Digit Verification Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                placeholder="e.g. 123456"
                value={loginOtp}
                onChange={e => setLoginOtp(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded py-2.5 px-3 text-center tracking-[0.5em] font-bold text-sm text-stone-900 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-[#8c6239] focus:border-[#8c6239]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-black hover:bg-[#8c6239] text-white text-xs font-bold uppercase tracking-wider rounded transition-all shadow cursor-pointer"
            >
              Verify & Access Dashboard
            </button>

            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider pt-2">
              <button
                type="button"
                onClick={() => {
                  setLoginStep('email');
                  setAuthError('');
                  setAuthSuccessMsg('');
                }}
                className="text-stone-400 hover:text-black transition-colors cursor-pointer"
              >
                Change Email
              </button>
              <button
                type="button"
                onClick={handleSendOtp}
                className="text-[#8c6239] hover:text-[#5c3e21] transition-colors cursor-pointer"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        <div className="text-center pt-2 border-t border-stone-100">
          <span className="text-[8px] text-stone-400 uppercase tracking-widest">Powered by Supabase Auth</span>
        </div>
      </div>
    </div>
  );
}
