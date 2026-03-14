import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, ShoppingBasket } from 'lucide-react'
import type { Prodotto } from '../types'

const fmt = (n?: number) => n ? `€${Number(n).toFixed(2)}` : '—'
const EMOJI: Record<string, string> = {
  'Frutta secca': '🌰',
  'Verdura': '🥬',
  'Condimenti': '🫒',
  'Apicultura': '🍯',
  'Frutta': '🍊'
}

export default function Prodotti() {
  const [prodotti, setProdotti] = useState<Prodotto[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('prodotti').select('*').eq('disponibile', true).order('categoria')
      .then(({ data }) => { setProdotti(data as Prodotto[] || []); setLoading(false) })
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
          <h2 className="font-serif text-3xl">Catalogo Prodotti</h2>
          <p className="text-sm text-gray-400 mt-1">
            Produzione biologica certificata · {prodotti.length} disponibili
          </p>
        </div>
        <button className="btn-primary"><Plus size={14} />Nuovo prodotto</button>
      </div>

      {prodotti.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🛒</div>
          <div className="font-semibold text-gray-500">Nessun prodotto</div>
          <div className="text-sm text-gray-400 mt-1">Esegui il seed SQL per vedere i prodotti</div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {prodotti.map(p => (
            <div key={p.id} className="card p-4 hover:-translate-y-1 hover:shadow-lg transition-all">
              <div className="text-4xl mb-3">{EMOJI[p.categoria ?? ''] ?? '🌿'}</div>
              <div className="font-semibold text-sm mb-1 leading-tight">{p.nome}</div>
              <div className="text-xs text-gray-400 mb-2">{p.categoria}</div>
              {p.certificazione_bio && (
                <span className="badge-verde text-[11px] mb-3 inline-flex">🌿 Bio</span>
              )}
              <div className="font-serif text-2xl text-verde-700 mb-0.5">
                {fmt(p.prezzo_unitario)}
                <span className="text-sm font-sans font-normal text-gray-400"> /{p.unita_misura}</span>
              </div>
              <div className="text-xs text-gray-400 mb-3">
                {p.quantita_disponibile} {p.unita_misura} disponibili
              </div>
              <button className="w-full btn-primary text-xs py-2 justify-center">
                <ShoppingBasket size={12} />Ordina
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}