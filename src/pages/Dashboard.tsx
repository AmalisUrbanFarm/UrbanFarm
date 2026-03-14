import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { MapPin, Sprout, Leaf, Activity, ArrowUpRight } from 'lucide-react'
import type { Campo, Attivita, Coltura } from '../types'

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short' }) : '—'

const CAMPO_EMOJI: Record<string, string> = { 'AUF-C001': '🌰', 'AUF-C002': '🥬', 'AUF-C003': '🍇', 'AUF-C004': '🌡️', 'AUF-C005': '🍊' }
const CAMPO_GRAD: Record<string, string>  = { 'AUF-C001': 'from-verde-900 to-verde-600', 'AUF-C002': 'from-emerald-900 to-emerald-600', 'AUF-C003': 'from-purple-900 to-purple-600', 'AUF-C004': 'from-yellow-800 to-yellow-600', 'AUF-C005': 'from-orange-900 to-orange-600' }
const STATO_BADGE: Record<string, string> = { attivo: 'badge-verde', in_attesa: 'badge-oro', sospeso: 'badge-red', scaduto: 'badge-red', in_preparazione: 'badge-blue', in_riposo: 'badge-gray' }
const STEPS: string[] = ['semina', 'crescita', 'fioritura', 'raccolta', 'completata']

export default function Dashboard() {
  const { profile }           = useAuth()
  const [campi, setCampi]     = useState<Campo[]>([])
  const [attivita, setAtt]    = useState<Attivita[]>([])
  const [colture, setColture] = useState<Coltura[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      supabase.from('campi').select('id,codice,nome,comune,superficie_mq,stato').order('codice'),
      supabase.from('attivita').select('id,titolo,tipo,data_attivita,campi(nome),profiles(nome,cognome)').order('data_attivita', { ascending: false }).limit(6),
      supabase.from('colture').select('id,nome_coltura,varieta,stato,campi(nome)').neq('stato', 'completata').limit(12)
    ]).then(([c, a, col]) => {
      setCampi(c.data as Campo[] || [])
      setAtt(a.data as Attivita[] || [])
      setColture(col.data as Coltura[] || [])
      setLoading(false)
    })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-verde-300 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalMq = campi.reduce((s, c) => s + (Number(c.superficie_mq) || 0), 0)

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-2xl font-semibold text-gray-800">Benvenuto, {profile?.nome} 🌿</h2>
        <p className="text-sm text-gray-400 mt-1">Divisione Rigenerazione Agricola Sicilia</p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Campi attivi',     val: campi.filter(c => c.stato === 'attivo').length, sub: `${(totalMq / 1000).toFixed(1)}k m² totali`, icon: MapPin,   cls: 'bg-verde-100 text-verde-600' },
          { label: 'Colture in corso', val: colture.length,  sub: 'stagione 2026', icon: Sprout,   cls: 'bg-yellow-100 text-yellow-700' },
          { label: 'Produzione bio',   val: '100%',          sub: 'certificato',   icon: Leaf,     cls: 'bg-emerald-100 text-emerald-700' },
          { label: 'Attività recenti', val: attivita.length, sub: 'ultimi log',    icon: Activity, cls: 'bg-blue-100 text-blue-700' },
        ].map(s => (
          <div key={s.label} className="card p-5 hover:-translate-y-0.5 transition-transform">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-4 ${s.cls}`}>
              <s.icon size={17} />
            </div>
            <div className="text-[34px] font-bold leading-none text-gray-900">{s.val}</div>
            <div className="text-xs text-gray-400 mt-1">{s.label}</div>
            <div className="text-xs text-verde-600 mt-2 flex items-center gap-1">
              <ArrowUpRight size={12} />{s.sub}
            </div>
          </div>
        ))}
      </div>

      {/* CAMPI + ATTIVITÀ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <MapPin size={14} className="text-verde-500" />
            <span className="font-semibold text-sm">Campi Attivi</span>
          </div>
          <div className="divide-y divide-gray-50">
            {campi.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">Esegui la migration SQL per vedere i campi</div>
            ) : campi.map(c => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-verde-50 transition-colors">
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${CAMPO_GRAD[c.codice] ?? 'from-verde-900 to-verde-600'} flex items-center justify-center text-lg flex-shrink-0`}>
                  {CAMPO_EMOJI[c.codice] ?? '🌿'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{c.nome}</div>
                  <div className="text-xs text-gray-400">{c.comune} · {c.superficie_mq?.toLocaleString('it')} m²</div>
                </div>
                <span className={STATO_BADGE[c.stato] ?? 'badge-gray'}>{c.stato}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Activity size={14} className="text-verde-500" />
            <span className="font-semibold text-sm">Ultime Attività</span>
          </div>
          <div className="p-4 space-y-3">
            {attivita.length === 0 ? (
              <div className="text-center py-6 text-sm text-gray-400">Nessuna attività registrata</div>
            ) : attivita.map(a => (
              <div key={a.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-verde-300 mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{a.titolo}</div>
                  <div className="text-xs text-gray-400">{a.campi?.nome} · {a.profiles?.nome} {a.profiles?.cognome}</div>
                </div>
                <span className="text-[11px] text-gray-400 whitespace-nowrap">{fmtDate(a.data_attivita)}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* COLTURE PROGRESS */}
      {colture.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Sprout size={14} className="text-verde-500" />
            <span className="font-semibold text-sm">Stato Colture</span>
          </div>
          <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {colture.map(c => {
              const pct = Math.round(((STEPS.indexOf(c.stato) + 1) / STEPS.length) * 100)
              return (
                <div key={c.id} className="bg-gray-50 rounded-xl p-3">
                  <div className="font-semibold text-[13px] mb-0.5">{c.nome_coltura}</div>
                  {c.varieta && <div className="text-xs text-gray-400 italic mb-1">{c.varieta}</div>}
                  <div className="text-xs text-gray-400 mb-2">{c.campi?.nome}</div>
                  <div className="flex justify-between items-center mb-1">
                    <span className={`${STATO_BADGE[c.stato] ?? 'badge-gray'} text-[11px]`}>{c.stato}</span>
                    <span className="text-[11px] text-gray-400">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-verde-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}