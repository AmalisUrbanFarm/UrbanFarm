import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Search, Edit2 } from 'lucide-react'
import type { Socio } from '../types'

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const fmt = (n?: number) => n ? `€${Number(n).toFixed(2)}` : '—'

const STATO_BADGE: Record<string, string> = {
  attivo: 'badge-verde',
  in_attesa: 'badge-oro',
  sospeso: 'badge-red',
  scaduto: 'badge-red'
}

export default function Soci() {
  const [soci, setSoci]       = useState<Socio[]>([])
  const [search, setSearch]   = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('soci').select('*, profiles(nome,cognome,email,telefono,comune)')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setSoci(data as Socio[] || []); setLoading(false) })
  }, [])

  const lista = soci.filter(s => {
    const q = search.toLowerCase()
    return !q || [s.profiles?.nome, s.profiles?.cognome, s.profiles?.email, s.numero_tessera]
      .some(v => v?.toLowerCase().includes(q))
  })

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-verde-300 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-serif text-3xl">Gestione Soci</h2>
          <p className="text-sm text-gray-400 mt-1">
            {soci.filter(s => s.stato === 'attivo').length} attivi su {soci.length} totali
          </p>
        </div>
        <button className="btn-primary"><Plus size={14} />Nuovo socio</button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { l: 'Attivi',    v: soci.filter(s => s.stato === 'attivo').length,    c: 'bg-verde-500' },
          { l: 'In attesa', v: soci.filter(s => s.stato === 'in_attesa').length, c: 'bg-yellow-500' },
          { l: 'Scaduti',   v: soci.filter(s => s.stato === 'scaduto').length,   c: 'bg-red-500' },
        ].map(s => (
          <div key={s.l} className="card p-4 flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${s.c} flex-shrink-0`} />
            <div>
              <div className="font-serif text-2xl">{s.v}</div>
              <div className="text-xs text-gray-400">{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH */}
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-verde-500"
          placeholder="Cerca per nome, email, tessera..."
        />
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">👥</div>
          <div className="font-semibold text-gray-500">
            {soci.length === 0 ? 'Nessun socio — esegui la migration' : 'Nessun risultato'}
          </div>
        </div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Socio', 'Tessera', 'Tipo', 'Stato', 'Scadenza', 'Quota', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(s => (
                <tr key={s.id} className="border-b border-gray-50 hover:bg-verde-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-verde-100 text-verde-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {(s.profiles?.nome?.[0] ?? '') + (s.profiles?.cognome?.[0] ?? '')}
                      </div>
                      <div>
                        <div className="font-medium">{s.profiles?.nome} {s.profiles?.cognome}</div>
                        <div className="text-xs text-gray-400">{s.profiles?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.numero_tessera}</td>
                  <td className="px-4 py-3"><span className="badge-gray capitalize">{s.tipo_socio}</span></td>
                  <td className="px-4 py-3"><span className={STATO_BADGE[s.stato] ?? 'badge-gray'}>{s.stato}</span></td>
                  <td className="px-4 py-3">{fmtDate(s.data_scadenza)}</td>
                  <td className="px-4 py-3 font-medium">{fmt(s.quota_annuale)}</td>
                  <td className="px-4 py-3">
                    <button className="text-gray-400 hover:text-verde-600 transition-colors"><Edit2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}