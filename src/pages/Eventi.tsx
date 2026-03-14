import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus } from 'lucide-react'
import type { Evento } from '../types'

const TIPO_BADGE: Record<string, string> = {
  evento:     'badge-verde',
  formazione: 'badge-blue',
  assemblea:  'badge-oro',
  workshop:   'bg-orange-100 text-orange-700 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
}

export default function Eventi() {
  const [eventi, setEventi]   = useState<Evento[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('eventi').select('*')
      .gte('data_inizio', new Date().toISOString())
      .order('data_inizio')
      .then(({ data }) => { setEventi(data as Evento[] || []); setLoading(false) })
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
          <h2 className="font-serif text-3xl">Calendario Eventi</h2>
          <p className="text-sm text-gray-400 mt-1">{eventi.length} eventi in programma</p>
        </div>
        <button className="btn-primary"><Plus size={14} />Nuovo evento</button>
      </div>

      {eventi.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📅</div>
          <div className="font-semibold text-gray-500">Nessun evento in programma</div>
          <div className="text-sm text-gray-400 mt-1">Esegui il seed SQL per vedere gli eventi</div>
        </div>
      ) : (
        <div className="space-y-3">
          {eventi.map(e => {
            const d = new Date(e.data_inizio)
            return (
              <div key={e.id} className="card flex overflow-hidden hover:shadow-md transition-shadow">
                <div className="w-16 bg-verde-700 flex flex-col items-center justify-center flex-shrink-0">
                  <div className="text-verde-300 text-[10px] font-semibold uppercase">
                    {d.toLocaleDateString('it-IT', { month: 'short' })}
                  </div>
                  <div className="font-serif text-white text-3xl leading-none">{d.getDate()}</div>
                </div>
                <div className="flex-1 px-5 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-sm mb-1">{e.titolo}</div>
                      <div className="text-xs text-gray-400 mb-2">{e.luogo}</div>
                      {e.descrizione && (
                        <div className="text-sm text-gray-600 leading-relaxed">{e.descrizione}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <span className={TIPO_BADGE[e.tipo] ?? 'badge-gray'}>{e.tipo}</span>
                      {e.posti_disponibili && (
                        <span className="text-xs text-gray-400">{e.posti_disponibili} posti</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center pr-4">
                  <button className="btn-secondary text-xs">
                    {e.iscrizione_richiesta ? 'Iscriviti' : 'Partecipa'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}