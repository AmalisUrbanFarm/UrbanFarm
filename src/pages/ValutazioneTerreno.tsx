import { useState, useCallback, useRef } from 'react'
import { MapPin, ChevronRight, ChevronLeft, Save, FileText, CheckCircle, Droplets, Zap, Sun, Wind, Thermometer, Layers, TreePine, Home, Wheat, Bug, Egg, Leaf } from 'lucide-react'
import { supabase } from '../lib/supabase'

// ─── Tipi ────────────────────────────────────────────────────
interface DatiValutazione {
  // Step 1 — Posizione
  comune: string
  provincia: string
  indirizzo: string
  latitudine: number | null
  longitudine: number | null
  // Step 2 — Caratteristiche fisiche
  superficie_ettari: number | null
  tipo_suolo: string
  ph_suolo: string
  pendenza: string
  esposizione: string
  // Step 3 — Risorse disponibili
  acqua_disponibile: boolean
  fonte_acqua: string
  elettricita_disponibile: boolean
  strutture_esistenti: boolean
  tipo_strutture: string
  accessibilita: string
  // Step 4 — Contesto
  zona_climatica: string
  presenza_alberi: boolean
  uso_precedente: string
  vincoli_ambientali: boolean
  note: string
}

interface Risultato {
  score: number
  coltura_primaria: string
  coltura_secondaria: string
  coltura_terziaria: string
  ricavo_min: number
  ricavo_max: number
  quota_proprietario_min: number
  quota_proprietario_max: number
  motivazione: string
  fattori_positivi: string[]
  fattori_negativi: string[]
}

const PROVINCE_SICILIA = ['Agrigento', 'Caltanissetta', 'Catania', 'Enna', 'Messina', 'Palermo', 'Ragusa', 'Siracusa', 'Trapani']

const COLTURE_ICONS: Record<string, any> = {
  'Oliveto': TreePine,
  'Agrumeto': Leaf,
  'Vigneto': Leaf,
  'Grano duro': Wheat,
  'Serra idroponica': Droplets,
  'Elicicoltura': Bug,
  'Allevamento avicolo': Egg,
  'Agriturismo': Home,
  'Mandorleto': TreePine,
}

// ─── Algoritmo di valutazione ────────────────────────────────
function calcolaValutazione(dati: DatiValutazione): Risultato {
  let score = 0
  const positivi: string[] = []
  const negativi: string[] = []

  // Superficie
  const sup = dati.superficie_ettari ?? 0
  if (sup >= 20) { score += 25; positivi.push('Superficie ampia (≥ 20 ha)') }
  else if (sup >= 5) { score += 18; positivi.push('Superficie buona (5–20 ha)') }
  else if (sup >= 1) { score += 10 }
  else { score += 4; negativi.push('Superficie molto ridotta') }

  // Acqua
  if (dati.acqua_disponibile) {
    score += 20; positivi.push('Disponibilità idrica confermata')
    if (dati.fonte_acqua === 'pozzo') { score += 5; positivi.push('Pozzo proprio — autonomia idrica totale') }
  } else {
    negativi.push('Nessuna fonte idrica disponibile')
  }

  // Elettricità
  if (dati.elettricita_disponibile) {
    score += 10; positivi.push('Allacciamento elettrico disponibile')
  } else {
    negativi.push('Elettricità assente — limita le opzioni')
  }

  // Strutture
  if (dati.strutture_esistenti) {
    score += 10; positivi.push('Strutture esistenti valorizzabili')
  }

  // Pendenza
  if (dati.pendenza === 'pianeggiante') { score += 15; positivi.push('Terreno pianeggiante — ideale per la meccanizzazione') }
  else if (dati.pendenza === 'lieve') { score += 10 }
  else if (dati.pendenza === 'media') { score += 5 }
  else { negativi.push('Pendenza elevata — limita alcune colture') }

  // Accessibilità
  if (dati.accessibilita === 'ottima') { score += 8; positivi.push('Accessibilità stradale ottima') }
  else if (dati.accessibilita === 'buona') { score += 5 }
  else { negativi.push('Accessibilità difficoltosa') }

  // Vincoli
  if (dati.vincoli_ambientali) { score -= 10; negativi.push('Presenza di vincoli ambientali') }

  // Ph suolo
  if (dati.ph_suolo === 'neutro') { score += 7; positivi.push('pH suolo ottimale (neutro)') }
  else if (dati.ph_suolo === 'subacido' || dati.ph_suolo === 'subalcalino') { score += 4 }

  score = Math.max(0, Math.min(100, score))

  // ── Selezione colture ──────────────────────────────────────
  let coltura_primaria = 'Grano duro'
  let coltura_secondaria = 'Mandorleto'
  let coltura_terziaria = 'Elicicoltura'
  let ricavo_base_ha = 1200

  const ha = sup || 1

  // Logica selezione
  if (dati.strutture_esistenti && ha >= 5 && dati.acqua_disponibile) {
    coltura_primaria = 'Agriturismo'
    coltura_secondaria = 'Oliveto'
    coltura_terziaria = 'Vigneto'
    ricavo_base_ha = 6500
  } else if (dati.acqua_disponibile && dati.elettricita_disponibile && ha >= 0.5 && dati.pendenza !== 'elevata') {
    coltura_primaria = 'Serra idroponica'
    coltura_secondaria = 'Oliveto'
    coltura_terziaria = 'Elicicoltura'
    ricavo_base_ha = 24000
  } else if (ha >= 15 && dati.pendenza !== 'elevata') {
    coltura_primaria = 'Oliveto'
    coltura_secondaria = 'Mandorleto'
    coltura_terziaria = 'Grano duro'
    ricavo_base_ha = 2500
  } else if (ha >= 3 && dati.acqua_disponibile) {
    coltura_primaria = 'Elicicoltura'
    coltura_secondaria = 'Grano duro'
    coltura_terziaria = 'Mandorleto'
    ricavo_base_ha = 12000
  } else if (dati.provincia === 'Catania' || dati.provincia === 'Siracusa') {
    coltura_primaria = 'Agrumeto'
    coltura_secondaria = 'Oliveto'
    coltura_terziaria = 'Mandorleto'
    ricavo_base_ha = 3200
  } else if (ha >= 5 && dati.acqua_disponibile) {
    coltura_primaria = 'Allevamento avicolo'
    coltura_secondaria = 'Grano duro'
    coltura_terziaria = 'Oliveto'
    ricavo_base_ha = 1500
  }

  const variazione = 0.3
  const ricavo_min = Math.round(ricavo_base_ha * ha * (1 - variazione) / 100) * 100
  const ricavo_max = Math.round(ricavo_base_ha * ha * (1 + variazione) / 100) * 100

  const motivazione = coltura_primaria === 'Serra idroponica'
    ? 'Disponibilità di acqua ed elettricità permettono un impianto idroponico ad alta resa. Resa fino a 10x rispetto alla coltivazione tradizionale.'
    : coltura_primaria === 'Agriturismo'
    ? 'Le strutture esistenti e la superficie consentono di sviluppare un\'attività agrituristica, la più redditizia tra le opzioni disponibili.'
    : coltura_primaria === 'Oliveto'
    ? 'La superficie ampia e le caratteristiche pedoclimatiche della zona sono ideali per un oliveto intensivo con produzione DOP.'
    : coltura_primaria === 'Elicicoltura'
    ? 'L\'elicicoltura richiede poca acqua e strutture minime, con un mercato in forte crescita. Marginalità alta rispetto all\'investimento.'
    : coltura_primaria === 'Agrumeto'
    ? 'La zona geografica e il clima siciliano sono perfetti per agrumi. Mercato nazionale ed export consolidati.'
    : 'Le caratteristiche del terreno si prestano bene alla coltivazione cerealicola con metodi moderni e sostenibili.'

  return {
    score,
    coltura_primaria,
    coltura_secondaria,
    coltura_terziaria,
    ricavo_min,
    ricavo_max,
    quota_proprietario_min: Math.round(ricavo_min * 0.20),
    quota_proprietario_max: Math.round(ricavo_max * 0.30),
    motivazione,
    fattori_positivi: positivi,
    fattori_negativi: negativi,
  }
}

// ─── Componente Score Ring ────────────────────────────────────
function ScoreRing({ score }: { score: number }) {
  const r = 52
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#1a7f4e' : score >= 45 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative flex items-center justify-center" style={{ width: 130, height: 130 }}>
      <svg width="130" height="130" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="65" cy="65" r={r} fill="none" stroke="#e8e8ed" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold" style={{ color, letterSpacing: '-0.04em' }}>{score}</span>
        <span className="text-xs" style={{ color: '#86868b' }}>/100</span>
      </div>
    </div>
  )
}

// ─── Componente Coltura Card ──────────────────────────────────
function ColturaCard({ label, nome, rank }: { label: string; nome: string; rank: 1 | 2 | 3 }) {
  const Icon = COLTURE_ICONS[nome] ?? Leaf
  const opacity = rank === 1 ? 'opacity-100' : rank === 2 ? 'opacity-70' : 'opacity-50'
  const bg = rank === 1 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
  return (
    <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${bg} ${opacity}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${rank === 1 ? 'bg-green-600' : 'bg-gray-300'}`}>
        <Icon size={18} color="#fff" />
      </div>
      <div>
        <div className="text-xs font-medium" style={{ color: '#86868b' }}>{label}</div>
        <div className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>{nome}</div>
      </div>
    </div>
  )
}

// ─── Componente SelectField ───────────────────────────────────
function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[]
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#424245' }}>{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full rounded-lg border text-sm px-3 py-2 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
        style={{ background: '#f5f5f7', borderColor: '#e8e8ed', color: '#1d1d1f' }}
      >
        <option value="">— seleziona —</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  )
}

function InputField({ label, value, onChange, type = 'text', placeholder = '' }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1" style={{ color: '#424245' }}>{label}</label>
      <input
        type={type}
        value={value ?? ''}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border text-sm px-3 py-2 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
        style={{ background: '#f5f5f7', borderColor: '#e8e8ed', color: '#1d1d1f' }}
      />
    </div>
  )
}

function Toggle({ label, checked, onChange, icon: Icon }: {
  label: string; checked: boolean; onChange: (v: boolean) => void; icon?: any
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
        checked ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'
      }`}
    >
      {Icon && <Icon size={14} />}
      {label}
      <div className={`ml-auto w-8 h-4 rounded-full transition-all ${checked ? 'bg-green-500' : 'bg-gray-300'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? 'translate-x-4' : 'translate-x-0'}`} style={{ transform: checked ? 'translateX(16px)' : 'translateX(0)' }} />
      </div>
    </button>
  )
}

// ─── Mappa semplice (Leaflet-free, iframe OpenStreetMap) ─────
function MappaTerreno({ lat, lng, onSelect }: {
  lat: number | null; lng: number | null; onSelect: (lat: number, lng: number) => void
}) {
  const defaultLat = lat ?? 37.5
  const defaultLng = lng ?? 14.0
  const zoom = lat ? 14 : 8

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden" style={{ minHeight: 340 }}>
      <iframe
        title="mappa"
        width="100%"
        height="100%"
        style={{ border: 'none', display: 'block' }}
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${defaultLng - 0.05},${defaultLat - 0.05},${defaultLng + 0.05},${defaultLat + 0.05}&layer=mapnik&marker=${defaultLat},${defaultLng}`}
      />
      <div
        className="absolute bottom-3 left-3 right-3 rounded-lg px-3 py-2 flex items-center gap-2 text-xs font-medium cursor-pointer transition-all hover:opacity-90"
        style={{ background: 'rgba(255,255,255,0.95)', color: '#1a7f4e', boxShadow: '0 2px 12px rgba(0,0,0,0.12)' }}
        onClick={() => {
          const input = prompt('Inserisci le coordinate (lat, lng)\nEs: 37.5079, 15.0830')
          if (!input) return
          const parts = input.split(',').map(s => parseFloat(s.trim()))
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            onSelect(parts[0], parts[1])
          } else {
            alert('Formato non valido. Usa: 37.5079, 15.0830')
          }
        }}
      >
        <MapPin size={14} />
        {lat && lng ? `📍 ${lat.toFixed(4)}, ${lng.toFixed(4)} — clicca per modificare` : 'Clicca per inserire le coordinate del terreno'}
      </div>
    </div>
  )
}

// ─── Steps config ─────────────────────────────────────────────
const STEPS = ['Posizione', 'Caratteristiche', 'Risorse', 'Contesto', 'Risultati']

// ─── Componente principale ────────────────────────────────────
export default function ValutazioneTerreno() {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [dati, setDati] = useState<DatiValutazione>({
    comune: '', provincia: '', indirizzo: '', latitudine: null, longitudine: null,
    superficie_ettari: null, tipo_suolo: '', ph_suolo: '', pendenza: '', esposizione: '',
    acqua_disponibile: false, fonte_acqua: '', elettricita_disponibile: false,
    strutture_esistenti: false, tipo_strutture: '', accessibilita: '',
    zona_climatica: '', presenza_alberi: false, uso_precedente: '', vincoli_ambientali: false, note: '',
  })

  const set = useCallback(<K extends keyof DatiValutazione>(key: K, val: DatiValutazione[K]) => {
    setDati(prev => ({ ...prev, [key]: val }))
  }, [])

  const risultato: Risultato | null = step === 4 ? calcolaValutazione(dati) : null

  const canProceed = () => {
    if (step === 0) return dati.comune && dati.provincia
    if (step === 1) return dati.superficie_ettari && dati.pendenza
    return true
  }

  const salvaSupabase = async () => {
    if (!risultato) return
    setSaving(true)
    try {
      const payload = {
        comune: dati.comune,
        provincia: dati.provincia,
        indirizzo: dati.indirizzo || null,
        latitudine: dati.latitudine,
        longitudine: dati.longitudine,
        superficie_ha: dati.superficie_ettari,
        tipo_suolo: dati.tipo_suolo || null,
        ph_suolo: dati.ph_suolo || null,
        pendenza: dati.pendenza || null,
        acqua_disponibile: dati.acqua_disponibile,
        elettricita_disponibile: dati.elettricita_disponibile,
        strutture_esistenti: dati.strutture_esistenti,
        accessibilita: dati.accessibilita || null,
        zona_climatica: dati.zona_climatica || null,
        uso_precedente: dati.uso_precedente || null,
        vincoli_ambientali: dati.vincoli_ambientali,
        score: risultato.score,
        coltura_primaria: risultato.coltura_primaria,
        coltura_secondaria: risultato.coltura_secondaria,
        coltura_terziaria: risultato.coltura_terziaria,
        ricavo_min: risultato.ricavo_min,
        ricavo_max: risultato.ricavo_max,
        quota_min: risultato.quota_proprietario_min,
        quota_max: risultato.quota_proprietario_max,
        stato: 'valutazione',
        note: dati.note || null,
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('terreni') as any).insert(payload)
      if (error) throw error
      setSaved(true)
    } catch (e) {
      alert('Errore nel salvataggio. Controlla la connessione Supabase.')
    } finally {
      setSaving(false)
    }
  }

  const stampaPDF = () => {
    if (!risultato) return
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(`
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Valutazione Terreno — ${dati.comune}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1d1d1f; padding: 48px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #1a7f4e; }
  .logo { font-size: 18px; font-weight: 700; color: #1a7f4e; }
  .logo span { display: block; font-size: 11px; font-weight: 400; color: #86868b; margin-top: 2px; }
  .data { font-size: 12px; color: #86868b; text-align: right; }
  h1 { font-size: 28px; font-weight: 700; letter-spacing: -0.03em; color: #000; margin-bottom: 4px; }
  .sub { font-size: 14px; color: #86868b; margin-bottom: 32px; }
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; }
  .box { border: 1px solid #e8e8ed; border-radius: 12px; padding: 20px; }
  .box h3 { font-size: 11px; font-weight: 600; color: #86868b; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; }
  .score-big { font-size: 56px; font-weight: 700; color: ${risultato.score >= 70 ? '#1a7f4e' : risultato.score >= 45 ? '#f59e0b' : '#ef4444'}; letter-spacing: -0.04em; line-height: 1; }
  .score-label { font-size: 13px; color: #86868b; margin-top: 4px; }
  .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #f5f5f7; font-size: 13px; }
  .row:last-child { border-bottom: none; }
  .row .k { color: #86868b; }
  .row .v { font-weight: 500; color: #1d1d1f; }
  .coltura-prima { background: #e8f5ee; border-radius: 8px; padding: 12px 16px; margin-bottom: 8px; }
  .coltura-prima .nome { font-size: 18px; font-weight: 700; color: #1a7f4e; }
  .coltura-prima .label { font-size: 11px; color: #86868b; margin-bottom: 2px; }
  .ricavi { background: #1a7f4e; border-radius: 12px; padding: 20px; color: #fff; margin-bottom: 24px; }
  .ricavi .range { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
  .ricavi .sub { font-size: 12px; color: rgba(255,255,255,0.7); margin-top: 4px; }
  .ricavi .quota { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.2); font-size: 13px; color: rgba(255,255,255,0.85); }
  .chip { display: inline-block; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 500; margin: 2px; }
  .pos { background: #e8f5ee; color: #1a7f4e; }
  .neg { background: #fef2f2; color: #ef4444; }
  .note-box { background: #f5f5f7; border-radius: 10px; padding: 16px; font-size: 13px; color: #424245; line-height: 1.6; }
  .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e8e8ed; font-size: 11px; color: #86868b; display: flex; justify-content: space-between; }
  @media print { body { padding: 32px; } }
</style>
</head>
<body>
<div class="header">
  <div class="logo">Amalis Urban Farm 4.0 <span>Ramo agricolo · Amalis Group SRL</span></div>
  <div class="data">Report di Valutazione Terreno<br>${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
</div>

<h1>${dati.comune} (${dati.provincia})</h1>
<p class="sub">${dati.indirizzo || 'Indirizzo non specificato'} ${dati.latitudine ? `· GPS: ${dati.latitudine.toFixed(4)}, ${dati.longitudine?.toFixed(4)}` : ''}</p>

<div class="grid2">
  <div class="box">
    <h3>Score complessivo</h3>
    <div class="score-big">${risultato.score}</div>
    <div class="score-label">punti su 100 — ${risultato.score >= 70 ? 'Terreno eccellente' : risultato.score >= 50 ? 'Buon potenziale' : risultato.score >= 30 ? 'Potenziale moderato' : 'Potenziale basso'}</div>
  </div>
  <div class="box">
    <h3>Dati generali</h3>
    <div class="row"><span class="k">Superficie</span><span class="v">${dati.superficie_ettari ?? '—'} ha</span></div>
    <div class="row"><span class="k">Tipo suolo</span><span class="v">${dati.tipo_suolo || '—'}</span></div>
    <div class="row"><span class="k">Pendenza</span><span class="v">${dati.pendenza || '—'}</span></div>
    <div class="row"><span class="k">Acqua</span><span class="v">${dati.acqua_disponibile ? '✓ Disponibile' : '✗ Non disponibile'}</span></div>
    <div class="row"><span class="k">Elettricità</span><span class="v">${dati.elettricita_disponibile ? '✓ Disponibile' : '✗ Non disponibile'}</span></div>
  </div>
</div>

<h3 style="font-size:11px;font-weight:600;color:#86868b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px">Colture consigliate</h3>
<div class="coltura-prima">
  <div class="label">✦ Coltura primaria consigliata</div>
  <div class="nome">${risultato.coltura_primaria}</div>
</div>
<div style="display:flex;gap:8px;margin-bottom:24px">
  <div class="box" style="flex:1;padding:12px 14px">
    <div style="font-size:10px;color:#86868b;margin-bottom:3px">Alternativa 1</div>
    <div style="font-size:14px;font-weight:600">${risultato.coltura_secondaria}</div>
  </div>
  <div class="box" style="flex:1;padding:12px 14px">
    <div style="font-size:10px;color:#86868b;margin-bottom:3px">Alternativa 2</div>
    <div style="font-size:14px;font-weight:600">${risultato.coltura_terziaria}</div>
  </div>
</div>

<div class="ricavi">
  <div style="font-size:11px;opacity:.7;margin-bottom:4px;letter-spacing:.04em;text-transform:uppercase">Stima ricavi annui (${risultato.coltura_primaria})</div>
  <div class="range">€ ${risultato.ricavo_min.toLocaleString('it')} – € ${risultato.ricavo_max.toLocaleString('it')}</div>
  <div class="sub">Stima basata su dati medi di mercato 2024</div>
  <div class="quota">Quota proprietario (20–30%): <strong>€ ${risultato.quota_proprietario_min.toLocaleString('it')} – € ${risultato.quota_proprietario_max.toLocaleString('it')} / anno</strong></div>
</div>

<h3 style="font-size:11px;font-weight:600;color:#86868b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:12px">Motivazione scelta colturale</h3>
<div class="note-box" style="margin-bottom:24px">${risultato.motivazione}</div>

<div class="grid2" style="margin-bottom:24px">
  <div>
    <h3 style="font-size:11px;font-weight:600;color:#1a7f4e;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Fattori positivi</h3>
    ${risultato.fattori_positivi.map(f => `<span class="chip pos">✓ ${f}</span>`).join('')}
  </div>
  <div>
    <h3 style="font-size:11px;font-weight:600;color:#ef4444;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Criticità rilevate</h3>
    ${risultato.fattori_negativi.length ? risultato.fattori_negativi.map(f => `<span class="chip neg">✗ ${f}</span>`).join('') : '<span style="font-size:13px;color:#86868b">Nessuna criticità rilevante</span>'}
  </div>
</div>

${dati.note ? `<h3 style="font-size:11px;font-weight:600;color:#86868b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:8px">Note agronomo</h3><div class="note-box">${dati.note}</div>` : ''}

<div class="footer">
  <span>Amalis Urban Farm 4.0 · amalisfarm.com · Uso riservato agli amministratori</span>
  <span>* Stime indicative. La quota effettiva è definita nel contratto.</span>
</div>
</body>
</html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  return (
    <div className="min-h-screen" style={{ background: '#f5f5f7' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between" style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div>
          <h1 className="text-lg font-semibold" style={{ color: '#1d1d1f', letterSpacing: '-0.02em' }}>Valutazione Terreno</h1>
          <p className="text-xs" style={{ color: '#86868b' }}>Tool interno — Solo amministratori Amalis</p>
        </div>
        {/* Progress steps */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <button
                onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  i === step ? 'text-white' : i < step ? 'text-green-700 cursor-pointer' : 'text-gray-400 cursor-default'
                }`}
                style={{ background: i === step ? '#1a7f4e' : i < step ? '#e8f5ee' : '#e8e8ed' }}
              >
                {i < step ? <CheckCircle size={12} /> : <span>{i + 1}</span>}
                {s}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={14} style={{ color: '#c7c7cc' }} />}
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* STEP 0: Posizione */}
        {step === 0 && (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>Posizione del terreno</h2>
              <p className="text-sm mb-6" style={{ color: '#86868b' }}>Indica la localizzazione geografica del terreno da valutare.</p>
              <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Comune *" value={dati.comune} onChange={v => set('comune', v)} placeholder="es. Agrigento" />
                  <SelectField label="Provincia *" value={dati.provincia} onChange={v => set('provincia', v)}
                    options={PROVINCE_SICILIA.map(p => ({ value: p, label: p }))} />
                </div>
                <InputField label="Indirizzo / Contrada" value={dati.indirizzo} onChange={v => set('indirizzo', v)} placeholder="es. Contrada Bivona" />
                <div className="grid grid-cols-2 gap-4">
                  <InputField label="Latitudine" value={dati.latitudine ?? ''} onChange={v => set('latitudine', parseFloat(v) || null)} type="number" placeholder="es. 37.3154" />
                  <InputField label="Longitudine" value={dati.longitudine ?? ''} onChange={v => set('longitudine', parseFloat(v) || null)} type="number" placeholder="es. 13.5764" />
                </div>
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-bold mb-1" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>Seleziona sulla mappa</h2>
              <p className="text-sm mb-6" style={{ color: '#86868b' }}>Usa le coordinate per posizionare il terreno.</p>
              <div style={{ height: 340 }}>
                <MappaTerreno lat={dati.latitudine} lng={dati.longitudine} onSelect={(lat, lng) => { set('latitudine', lat); set('longitudine', lng) }} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: Caratteristiche fisiche */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>Caratteristiche fisiche</h2>
            <p className="text-sm mb-6" style={{ color: '#86868b' }}>Inserisci le caratteristiche pedologiche e morfologiche del terreno.</p>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <InputField label="Superficie stimata (ettari) *" value={dati.superficie_ettari ?? ''} onChange={v => set('superficie_ettari', parseFloat(v) || null)} type="number" placeholder="es. 5.5" />
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Tipo di suolo" value={dati.tipo_suolo} onChange={v => set('tipo_suolo', v)} options={[
                  { value: 'argilloso', label: 'Argilloso' }, { value: 'sabbioso', label: 'Sabbioso' },
                  { value: 'limoso', label: 'Limoso' }, { value: 'franco', label: 'Franco' },
                  { value: 'sassoso', label: 'Sassoso / Roccioso' },
                ]} />
                <SelectField label="pH del suolo" value={dati.ph_suolo} onChange={v => set('ph_suolo', v)} options={[
                  { value: 'acido', label: 'Acido (< 6)' }, { value: 'subacido', label: 'Subacido (6–6.5)' },
                  { value: 'neutro', label: 'Neutro (6.5–7.5)' }, { value: 'subalcalino', label: 'Subalcalino (7.5–8)' },
                  { value: 'alcalino', label: 'Alcalino (> 8)' }, { value: 'sconosciuto', label: 'Non rilevato' },
                ]} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <SelectField label="Pendenza *" value={dati.pendenza} onChange={v => set('pendenza', v)} options={[
                  { value: 'pianeggiante', label: 'Pianeggiante (0–5%)' }, { value: 'lieve', label: 'Lieve (5–15%)' },
                  { value: 'media', label: 'Media (15–30%)' }, { value: 'elevata', label: 'Elevata (> 30%)' },
                ]} />
                <SelectField label="Esposizione" value={dati.esposizione} onChange={v => set('esposizione', v)} options={[
                  { value: 'nord', label: 'Nord' }, { value: 'sud', label: 'Sud' },
                  { value: 'est', label: 'Est' }, { value: 'ovest', label: 'Ovest' },
                  { value: 'vario', label: 'Variabile' },
                ]} />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Risorse */}
        {step === 2 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>Risorse disponibili</h2>
            <p className="text-sm mb-6" style={{ color: '#86868b' }}>Indica le infrastrutture e risorse presenti sul o vicino al terreno.</p>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
              <div className="grid grid-cols-1 gap-3">
                <Toggle label="Disponibilità idrica" checked={dati.acqua_disponibile} onChange={v => set('acqua_disponibile', v)} icon={Droplets} />
                {dati.acqua_disponibile && (
                  <SelectField label="Fonte dell'acqua" value={dati.fonte_acqua} onChange={v => set('fonte_acqua', v)} options={[
                    { value: 'consorzio', label: 'Consorzio irriguo' }, { value: 'pozzo', label: 'Pozzo proprio' },
                    { value: 'fiume', label: 'Fiume / Canale' }, { value: 'acquedotto', label: 'Acquedotto comunale' },
                    { value: 'misto', label: 'Più fonti' },
                  ]} />
                )}
                <Toggle label="Allacciamento elettrico" checked={dati.elettricita_disponibile} onChange={v => set('elettricita_disponibile', v)} icon={Zap} />
                <Toggle label="Strutture esistenti (fabbricati, magazzini, vasche...)" checked={dati.strutture_esistenti} onChange={v => set('strutture_esistenti', v)} icon={Home} />
                {dati.strutture_esistenti && (
                  <InputField label="Descrivi le strutture" value={dati.tipo_strutture} onChange={v => set('tipo_strutture', v)} placeholder="es. Casolare, magazzino, vasca, pozzo..." />
                )}
              </div>
              <SelectField label="Accessibilità stradale" value={dati.accessibilita} onChange={v => set('accessibilita', v)} options={[
                { value: 'ottima', label: 'Ottima — strada asfaltata fino al terreno' },
                { value: 'buona', label: 'Buona — strada sterrata transitabile' },
                { value: 'discreta', label: 'Discreta — tratto difficoltoso' },
                { value: 'scarsa', label: 'Scarsa — solo a piedi o con fuoristrada' },
              ]} />
            </div>
          </div>
        )}

        {/* STEP 3: Contesto */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-1" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>Contesto e note</h2>
            <p className="text-sm mb-6" style={{ color: '#86868b' }}>Informazioni aggiuntive sul contesto ambientale e uso storico del terreno.</p>
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <SelectField label="Zona climatica" value={dati.zona_climatica} onChange={v => set('zona_climatica', v)} options={[
                { value: 'costiera', label: 'Costiera — mediterraneo caldo' },
                { value: 'collinare', label: 'Collinare — mediterraneo temperato' },
                { value: 'interna', label: 'Interna — subcontinentale' },
                { value: 'montana', label: 'Montana — fresca/umida' },
              ]} />
              <SelectField label="Uso precedente del terreno" value={dati.uso_precedente} onChange={v => set('uso_precedente', v)} options={[
                { value: 'coltivato', label: 'Coltivato fino a pochi anni fa' },
                { value: 'abbandonato_lungo', label: 'Abbandonato da lungo tempo (> 10 anni)' },
                { value: 'pascolo', label: 'Pascolo / uso zootecnico' },
                { value: 'incolto', label: 'Mai coltivato' },
                { value: 'vigneto_ex', label: 'Ex vigneto' }, { value: 'oliveto_ex', label: 'Ex oliveto' },
              ]} />
              <div className="grid grid-cols-1 gap-3">
                <Toggle label="Presenza di alberi / vegetazione spontanea" checked={dati.presenza_alberi} onChange={v => set('presenza_alberi', v)} icon={TreePine} />
                <Toggle label="Presenza di vincoli ambientali o paesaggistici" checked={dati.vincoli_ambientali} onChange={v => set('vincoli_ambientali', v)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: '#424245' }}>Note agronomo</label>
                <textarea
                  value={dati.note}
                  onChange={e => set('note', e.target.value)}
                  rows={4}
                  placeholder="Osservazioni durante il sopralluogo, aspetti particolari del terreno, condizioni generali..."
                  className="w-full rounded-lg border text-sm px-3 py-2 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all resize-none"
                  style={{ background: '#f5f5f7', borderColor: '#e8e8ed', color: '#1d1d1f' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Risultati */}
        {step === 4 && risultato && (
          <div>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#1d1d1f', letterSpacing: '-0.03em' }}>Risultati valutazione</h2>
                <p className="text-sm mt-1" style={{ color: '#86868b' }}>{dati.comune} ({dati.provincia}){dati.superficie_ettari ? ` · ${dati.superficie_ettari} ha` : ''}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={stampaPDF} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium border transition-all hover:bg-gray-50" style={{ borderColor: '#e8e8ed', color: '#1d1d1f' }}>
                  <FileText size={15} /> Stampa / PDF
                </button>
                <button
                  onClick={salvaSupabase}
                  disabled={saving || saved}
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white transition-all"
                  style={{ background: saved ? '#34c759' : '#1a7f4e' }}
                >
                  {saved ? <><CheckCircle size={15} /> Salvato</> : saving ? 'Salvataggio...' : <><Save size={15} /> Salva in piattaforma</>}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6">
              {/* Score */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center gap-4">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#86868b' }}>Score terreno</div>
                <ScoreRing score={risultato.score} />
                <div className="text-center">
                  <div className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>
                    {risultato.score >= 70 ? '✦ Terreno eccellente' : risultato.score >= 50 ? 'Buon potenziale' : risultato.score >= 30 ? 'Potenziale moderato' : 'Potenziale basso'}
                  </div>
                  <div className="text-xs mt-1" style={{ color: '#86868b' }}>basato su {risultato.fattori_positivi.length + risultato.fattori_negativi.length} fattori analizzati</div>
                </div>
              </div>

              {/* Colture */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#86868b' }}>Colture consigliate</div>
                <div className="space-y-2 mb-4">
                  <ColturaCard label="✦ Scelta principale" nome={risultato.coltura_primaria} rank={1} />
                  <ColturaCard label="Alternativa 1" nome={risultato.coltura_secondaria} rank={2} />
                  <ColturaCard label="Alternativa 2" nome={risultato.coltura_terziaria} rank={3} />
                </div>
                <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: '#f5f5f7', color: '#424245' }}>
                  {risultato.motivazione}
                </div>
              </div>

              {/* Ricavi */}
              <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
                <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#86868b' }}>Stima ricavi annui</div>
                <div className="rounded-xl p-5 flex-1" style={{ background: '#1a7f4e' }}>
                  <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Ricavo lordo stimato</div>
                  <div className="text-2xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
                    € {risultato.ricavo_min.toLocaleString('it')} – {risultato.ricavo_max.toLocaleString('it')}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>per {risultato.coltura_primaria}</div>
                  <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.65)' }}>Quota proprietario (20–30%)</div>
                    <div className="text-xl font-bold text-white">€ {risultato.quota_proprietario_min.toLocaleString('it')} – {risultato.quota_proprietario_max.toLocaleString('it')}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>all'anno</div>
                  </div>
                </div>
                <p className="text-xs" style={{ color: '#86868b' }}>* Stime indicative su dati medi di mercato 2024. La quota effettiva è definita nel contratto.</p>
              </div>
            </div>

            {/* Fattori */}
            <div className="grid grid-cols-2 gap-6 mt-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#1a7f4e' }}>Fattori positivi</div>
                {risultato.fattori_positivi.length ? (
                  <div className="space-y-2">
                    {risultato.fattori_positivi.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1d1d1f' }}>
                        <CheckCircle size={14} className="mt-0.5 flex-shrink-0" style={{ color: '#1a7f4e' }} />
                        {f}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm" style={{ color: '#86868b' }}>Nessun fattore positivo rilevante.</p>}
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#ef4444' }}>Criticità rilevate</div>
                {risultato.fattori_negativi.length ? (
                  <div className="space-y-2">
                    {risultato.fattori_negativi.map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#1d1d1f' }}>
                        <span className="mt-0.5 flex-shrink-0 text-red-500 font-bold text-xs">✗</span>
                        {f}
                      </div>
                    ))}
                  </div>
                ) : <p className="text-sm" style={{ color: '#86868b' }}>Nessuna criticità rilevante. Ottimo!</p>}
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <button
            onClick={() => setStep(s => Math.max(0, s - 1))}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${step === 0 ? 'opacity-0 pointer-events-none' : 'hover:bg-white'}`}
            style={{ borderColor: '#e8e8ed', color: '#1d1d1f' }}
          >
            <ChevronLeft size={16} /> Indietro
          </button>
          {step < 4 && (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white transition-all disabled:opacity-40"
              style={{ background: '#1a7f4e' }}
            >
              {step === 3 ? 'Calcola valutazione' : 'Avanti'} <ChevronRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
