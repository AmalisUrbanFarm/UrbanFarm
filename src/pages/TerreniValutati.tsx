import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  MapPin, ChevronRight, Search, RefreshCw,
  TrendingUp, Leaf, AlertCircle, CheckCircle, Clock
} from 'lucide-react'

interface Terreno {
  id: string
  created_at: string
  comune: string
  provincia: string
  indirizzo: string | null
  latitudine: number | null
  longitudine: number | null
  superficie_ha: number | null
  stato: string
  note: string | null
  score: number | null
  coltura_primaria: string | null
  coltura_secondaria: string | null
  coltura_terziaria: string | null
  ricavo_min: number | null
  ricavo_max: number | null
  quota_min: number | null
  quota_max: number | null
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 70 ? { bg: '#e8f5ee', text: '#1a7f4e' }
    : score >= 45 ? { bg: '#fef3c7', text: '#92400e' }
    : { bg: '#fef2f2', text: '#dc2626' }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: color.bg, color: color.text }}>
      {score}/100
    </span>
  )
}

function StatoIcon({ stato }: { stato: string }) {
  if (stato === 'valutazione') return <Clock size={13} style={{ color: '#f59e0b' }} />
  if (stato === 'approvato') return <CheckCircle size={13} style={{ color: '#1a7f4e' }} />
  return <AlertCircle size={13} style={{ color: '#86868b' }} />
}

export default function TerreniValutati() {
  const [terreni, setTerreni] = useState<Terreno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const carica = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('terreni')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      setTerreni(data)
    }
    setLoading(false)
  }

  useEffect(() => { carica() }, [])

  const filtrati = terreni.filter(t =>
    `${t.comune} ${t.provincia} ${t.coltura_primaria}`.toLowerCase().includes(search.toLowerCase())
  )

  const totale = terreni.length
  const mediaScore = totale ? Math.round(terreni.reduce((s, t) => s + (t.score ?? 0), 0) / totale) : 0
  const eccellenti = terreni.filter(t => (t.score ?? 0) >= 70).length

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>Terreni Valutati</h1>
          <p className="text-xs" style={{ color: '#86868b' }}>Archivio valutazioni — Solo amministratori Amalis</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={carica} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border transition-all hover:bg-gray-50" style={{ borderColor: '#e8e8ed', color: '#424245' }}>
            <RefreshCw size={13} /> Aggiorna
          </button>
          <button onClick={() => navigate('/valutazione-terreno')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white transition-all"
            style={{ background: '#1a7f4e' }}>
            + Nuova valutazione
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">

        {/* KPI strip */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Terreni valutati', value: totale, icon: MapPin },
            { label: 'Score medio', value: `${mediaScore}/100`, icon: TrendingUp },
            { label: 'Terreni eccellenti', value: eccellenti, icon: CheckCircle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-white rounded-2xl px-6 py-5 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#e8f5ee' }}>
                <Icon size={18} style={{ color: '#1a7f4e' }} />
              </div>
              <div>
                <div className="text-2xl font-bold" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>{value}</div>
                <div className="text-xs" style={{ color: '#86868b' }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: '#86868b' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca per comune, provincia o coltura..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
            style={{ background: '#fff', borderColor: '#e8e8ed', color: '#1d1d1f' }}
          />
        </div>

        {/* Lista */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#e8e8ed', borderTopColor: '#1a7f4e' }} />
          </div>
        ) : filtrati.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Leaf size={32} style={{ color: '#c7c7cc' }} />
            <p className="text-sm" style={{ color: '#86868b' }}>
              {search ? 'Nessun terreno trovato per questa ricerca.' : 'Nessuna valutazione ancora salvata.'}
            </p>
            {!search && (
              <button onClick={() => navigate('/valutazione-terreno')}
                className="mt-2 px-4 py-2 rounded-full text-sm font-medium text-white"
                style={{ background: '#1a7f4e' }}>
                Inizia la prima valutazione
              </button>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            {/* Intestazione tabella */}
            <div className="grid px-6 py-3 text-xs font-semibold uppercase tracking-wider border-b"
              style={{ gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', color: '#86868b', borderColor: '#f5f5f7', background: '#fafafa' }}>
              <span>Terreno</span>
              <span>Superficie</span>
              <span>Score</span>
              <span>Coltura consigliata</span>
              <span>Ricavi stimati</span>
              <span></span>
            </div>

            {filtrati.map((t, i) => (
              <div
                key={t.id}
                onClick={() => navigate(`/terreni-valutati/${t.id}`)}
                className="grid px-6 py-4 items-center cursor-pointer transition-colors hover:bg-gray-50"
                style={{
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto',
                  borderBottom: i < filtrati.length - 1 ? '1px solid #f5f5f7' : 'none'
                }}
              >
                {/* Luogo */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f5f5f7' }}>
                    <MapPin size={15} style={{ color: '#1a7f4e' }} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>{t.comune}</div>
                    <div className="text-xs flex items-center gap-1.5" style={{ color: '#86868b' }}>
                      <StatoIcon stato={t.stato} />
                      {t.provincia} · {new Date(t.created_at).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>

                {/* Superficie */}
                <div className="text-sm" style={{ color: '#1d1d1f' }}>
                  {t.superficie_ha ? `${t.superficie_ha} ha` : <span style={{ color: '#c7c7cc' }}>—</span>}
                </div>

                {/* Score */}
                <div>
                  <ScoreBadge score={t.score ?? 0} />
                </div>

                {/* Coltura */}
                <div className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{t.coltura_primaria ?? '—'}</div>

                {/* Ricavi */}
                <div className="text-sm font-semibold" style={{ color: '#1a7f4e' }}>
                  {t.ricavo_min && t.ricavo_max
                    ? `€ ${t.ricavo_min.toLocaleString('it')} – ${t.ricavo_max.toLocaleString('it')}`
                    : '—'}
                </div>

                {/* Freccia */}
                <ChevronRight size={16} style={{ color: '#c7c7cc' }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
