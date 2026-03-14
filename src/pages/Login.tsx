import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Eye, EyeOff, AlertCircle } from 'lucide-react'

type Mode = 'login' | 'register' | 'reset'

export default function Login() {
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [show, setShow]       = useState(false)
  const [err, setErr]         = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode]       = useState<Mode>('login')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setLoading(true)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
      if (error) setErr(error.message)
    } else if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email, password: pass,
        options: { data: { nome: 'Nuovo', cognome: 'Utente', ruolo: 'visitatore' } }
      })
      if (error) setErr(error.message)
      else setErr('✓ Controlla la tua email per confermare')
    } else {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) setErr(error.message)
      else setErr('✓ Email di reset inviata!')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex bg-verde-900 overflow-hidden">

      {/* SINISTRA */}
      <div className="flex-1 hidden md:flex flex-col justify-center px-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-verde-500/20 to-transparent" />
        <div className="relative">
          <div className="text-verde-300 text-[11px] font-semibold tracking-[3px] uppercase mb-5">
            Rigenerazione Agricola Sicilia
          </div>
          <h1 className="font-serif text-white text-6xl leading-tight mb-5">
            Amalis<br /><em className="text-verde-300">Urban Farm</em><br />4.0
          </h1>
          <p className="text-white/50 text-base leading-relaxed max-w-sm">
            Piattaforma integrata per la gestione dei campi biologici,
            il portale soci e la tracciabilità delle colture.
          </p>
          <div className="flex gap-10 mt-12">
            {[['5', 'Campi attivi'], ['Bio', 'Certificato'], ['2026', 'Stagione']].map(([v, l]) => (
              <div key={l}>
                <div className="font-serif text-3xl text-white">{v}</div>
                <div className="text-white/40 text-xs mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DESTRA */}
      <div className="w-full md:w-[440px] bg-cream flex items-center justify-center p-12">
        <div className="w-full max-w-[340px]">

          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-verde-700 rounded-xl flex items-center justify-center text-xl">🌿</div>
            <div>
              <div className="font-semibold text-sm">Amalis Urban Farm</div>
              <div className="text-xs text-gray-400">Divisione Sicilia</div>
            </div>
          </div>

          <h2 className="font-serif text-3xl mb-1">
            {mode === 'login' ? 'Accedi' : mode === 'register' ? 'Registrati' : 'Reset password'}
          </h2>
          <p className="text-gray-400 text-sm mb-8">
            {mode === 'login' ? 'Bentornato nella tua farm' : 'Crea il tuo account'}
          </p>

          {err && (
            <div className={`flex items-center gap-2 p-3 rounded-xl text-sm mb-4 ${
              err.startsWith('✓')
                ? 'bg-verde-50 text-verde-700 border border-verde-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <AlertCircle size={14} />{err}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-verde-500"
                placeholder="nome@example.com"
              />
            </div>

            {mode !== 'reset' && (
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={show ? 'text' : 'password'} value={pass} onChange={e => setPass(e.target.value)} required
                    className="w-full px-4 py-2.5 pr-10 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-verde-500"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit" disabled={loading}
              className="w-full bg-verde-700 text-white py-3 rounded-xl text-sm font-medium hover:bg-verde-500 transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Attendi...</>
                : mode === 'login' ? 'Accedi' : mode === 'register' ? 'Crea account' : 'Invia reset'
              }
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-400 space-x-3">
            {mode === 'login' ? <>
              <button onClick={() => setMode('reset')} className="text-verde-600 hover:underline">Password dimenticata?</button>
              <span>·</span>
              <button onClick={() => setMode('register')} className="text-verde-600 hover:underline">Registrati</button>
            </> : (
              <button onClick={() => setMode('login')} className="text-verde-600 hover:underline">← Torna al login</button>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}