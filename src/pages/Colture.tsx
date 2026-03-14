import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'
import type { Coltura, ColturaStatus } from '../types'

const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const STATO_BADGE: Record<string, string> = {
  semina: 'badge-blue',
  crescita: 'badge-verde',
  fioritura: 'badge-oro',
  raccolta: 'badge-oro',
  completata: 'badge-gray'
}

const STEPS: ColturaStatus[] = ['semina', 'crescita', 'fioritura', 'raccolta', 'completata']
const FILTRI = ['tutti', 'semina', 'crescita', 'fioritura', 'raccolta', 'completata']

export default function Colture() {
  const [colture, setColture] = useState<Coltura[]>([])
  const [filtro, setFiltro]   = useState('tutti')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('colture').select('*, campi(nome,codice)').order('created_at', { ascending: false })
      .then(({ data }) => { setColture(data as Coltura[] || []); setLoading(false) })
  }, [])

  const lista = filtro === 'tutti' ? colture : colture.filter(c => c.stato === filtro)

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-verde-300 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="font-serif text-3xl">Colture</h2>
          <p className="text-sm text-gray-400 mt-1">Tracciamento dalla semina alla raccolta</p>
        </div>
        <button className="btn-primary"><Plus size={14} />Nuova coltura</button>
      </div>

      {/* FILTRI */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {FILTRI.map(s => (
          <button key={s} onClick={() => setFiltro(s)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-all
              ${filtro === s
                ? 'bg-verde-100 border-verde-300 text-verde-700'
                : 'bg-white border-gray-200 text-gray-500 hover:border-verde-300'
              }`}>
            {s === 'tutti' ? 'Tutte' : s}
          </button>
        ))}
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌱</div>
          <div className="font-semibold text-gray-500">Nessuna coltura trovata</div>
          <div className="text-sm text-gray-400 mt-1">Esegui la migration SQL per vedere le colture</div>
        </div>
      ) : (
        <div className="card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                {['Coltura', 'Campo', 'Metodo', 'Semina', 'Raccolta prevista', 'Stato', '%'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lista.map(c => {
                const pct = Math.round(((STEPS.indexOf(c.stato) + 1) / STEPS.length) * 100)
                return (
                  <tr key={c.id} className="border-b border-gray-50 hover:bg-verde-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.nome_coltura}</div>
                      {c.varieta && <div className="text-xs text-gray-400 italic">{c.varieta}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div>{c.campi?.nome}</div>
                      <div className="text-xs font-mono text-gray-400">{c.campi?.codice}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-verde text-[11px]">{c.metodo_coltivazione ?? 'biologico'}</span>
                    </td>
                    <td className="px-4 py-3">{fmtDate(c.data_semina)}</td>
                    <td className="px-4 py-3">{fmtDate(c.data_prevista_raccolta)}</td>
                    <td className="px-4 py-3">
                      <span className={STATO_BADGE[c.stato] ?? 'badge-gray'}>{c.stato}</span>
                    </td>
                    <td className="px-4 py-3 w-24">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-verde-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-7">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}