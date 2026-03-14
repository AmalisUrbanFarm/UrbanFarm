import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'
import type { Campo } from '../types'

const EMOJI: Record<string, string> = { 'AUF-C001': '🌰', 'AUF-C002': '🥬', 'AUF-C003': '🍇', 'AUF-C004': '🌡️', 'AUF-C005': '🍊' }
const GRAD: Record<string, string>  = { 'AUF-C001': 'from-verde-900 to-verde-600', 'AUF-C002': 'from-emerald-900 to-emerald-600', 'AUF-C003': 'from-purple-900 to-purple-600', 'AUF-C004': 'from-yellow-800 to-yellow-600', 'AUF-C005': 'from-orange-900 to-orange-600' }

export default function Campi() {
  const [campi, setCampi]     = useState<Campo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('campi').select('*, colture(count)').order('codice')
      .then(({ data }) => { setCampi(data as Campo[] || []); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <div className="w-8 h-8 border-2 border-verde-300 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="font-serif text-3xl">Campi Agricoli</h2>
          <p className="text-sm text-gray-400 mt-1">{campi.length} appezzamenti registrati</p>
        </div>
        <button className="btn-primary"><Plus size={14} />Nuovo campo</button>
      </div>

      {campi.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌾</div>
          <div className="font-semibold text-gray-500">Nessun campo registrato</div>
          <div className="text-sm text-gray-400 mt-1">Esegui prima la migration SQL su Supabase</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {campi.map(c => (
            <div key={c.id} className="card hover:-translate-y-1 hover:shadow-xl transition-all cursor-pointer">
              <div className={`h-28 bg-gradient-to-br ${GRAD[c.codice] ?? 'from-verde-900 to-verde-600'} flex items-center justify-center relative`}>
                <span className="text-5xl">{EMOJI[c.codice] ?? '🌿'}</span>
                <span className="absolute top-2.5 right-2.5 bg-white/15 border border-white/20 text-white text-[11px] px-2 py-0.5 rounded-full font-medium">
                  {c.stato}
                </span>
              </div>
              <div className="p-4">
                <div className="font-serif text-lg">{c.nome}</div>
                <div className="text-xs text-gray-400 mb-3">{c.comune} · <span className="font-mono">{c.codice}</span></div>
                {c.tipo_suolo && <div className="text-xs text-gray-500 mb-3">Suolo: {c.tipo_suolo}</div>}
                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="font-semibold">{c.superficie_mq?.toLocaleString('it') ?? '—'}</span>
                    <span className="text-gray-400 text-xs"> m²</span>
                  </div>
                  <div>
                    <span className="font-semibold">{c.colture?.[0]?.count ?? 0}</span>
                    <span className="text-gray-400 text-xs"> colture</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}