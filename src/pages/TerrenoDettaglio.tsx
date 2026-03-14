import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  ArrowLeft, MapPin, Droplets, Zap, Home, CheckCircle,
  AlertCircle, Leaf, TrendingUp, User, Save, FileText, Camera, X, Upload
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
  tipo_suolo: string | null
  ph_suolo: string | null
  pendenza: string | null
  acqua_disponibile: boolean | null
  elettricita_disponibile: boolean | null
  strutture_esistenti: boolean | null
  accessibilita: string | null
  zona_climatica: string | null
  uso_precedente: string | null
  vincoli_ambientali: boolean | null
  score: number | null
  coltura_primaria: string | null
  coltura_secondaria: string | null
  coltura_terziaria: string | null
  ricavo_min: number | null
  ricavo_max: number | null
  quota_min: number | null
  quota_max: number | null
  stato: string
  note: string | null
  proprietario_id: string | null
}

interface Proprietario {
  id: string
  nome: string
  cognome: string
  email: string | null
}

interface Foto {
  id: string
  url: string
  nome: string | null
  created_at: string
}

function ScoreRing({ score }: { score: number }) {
  const r = 44
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  const color = score >= 70 ? '#1a7f4e' : score >= 45 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative flex items-center justify-center" style={{ width: 110, height: 110 }}>
      <svg width="110" height="110" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="55" cy="55" r={r} fill="none" stroke="#e8e8ed" strokeWidth="9" />
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold" style={{ color, letterSpacing: '-0.04em' }}>{score}</span>
        <span className="text-xs" style={{ color: '#86868b' }}>/100</span>
      </div>
    </div>
  )
}

function Chip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: ok ? '#e8f5ee' : '#f5f5f7', color: ok ? '#1a7f4e' : '#86868b' }}>
      {ok ? <CheckCircle size={11} /> : <AlertCircle size={11} />}
      {label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between py-2.5 border-b text-sm" style={{ borderColor: '#f5f5f7' }}>
      <span style={{ color: '#86868b' }}>{label}</span>
      <span className="font-medium" style={{ color: '#1d1d1f' }}>{value || '—'}</span>
    </div>
  )
}

const STATI = [
  { value: 'valutazione', label: 'In valutazione' },
  { value: 'approvato', label: 'Approvato' },
  { value: 'contratto', label: 'Contratto firmato' },
  { value: 'attivo', label: 'Attivo' },
  { value: 'rifiutato', label: 'Rifiutato' },
]

export default function TerrenoDettaglio() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [terreno, setTerreno] = useState<Terreno | null>(null)
  const [proprietari, setProprietari] = useState<Proprietario[]>([])
  const [foto, setFoto] = useState<Foto[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [fotoSelezionata, setFotoSelezionata] = useState<string | null>(null)

  // campi modificabili
  const [statoSel, setStatoSel] = useState('')
  const [propSel, setPropSel] = useState('')
  const [noteAdmin, setNoteAdmin] = useState('')

  useEffect(() => {
    const carica = async () => {
      setLoading(true)
      const [{ data: t }, { data: p }, { data: f }] = await Promise.all([
        (supabase.from('terreni') as any).select('*').eq('id', id).single(),
        supabase.from('profiles').select('id, nome, cognome, email').eq('ruolo', 'proprietario').order('cognome'),
        (supabase.from('terreni_foto') as any).select('*').eq('terreno_id', id).order('created_at', { ascending: false }),
      ])
      if (t) {
        setTerreno(t)
        setStatoSel(t.stato ?? 'valutazione')
        setPropSel(t.proprietario_id ?? '')
        setNoteAdmin(t.note ?? '')
      }
      if (p) setProprietari(p)
      if (f) setFoto(f)
      setLoading(false)
    }
    carica()
  }, [id])

  const caricaFoto = async () => {
    const { data } = await (supabase.from('terreni_foto') as any).select('*').eq('terreno_id', id).order('created_at', { ascending: false })
    if (data) setFoto(data)
  }

  const uploadFoto = async (files: FileList | null) => {
    if (!files || !terreno) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()
      const path = `${terreno.id}/${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('terreni-foto').upload(path, file)
      if (upErr) { alert(`Errore upload: ${file.name}`); continue }
      const { data: urlData } = supabase.storage.from('terreni-foto').getPublicUrl(path)
      await (supabase.from('terreni_foto') as any).insert({
        terreno_id: terreno.id,
        url: urlData.publicUrl,
        nome: file.name,
        dimensione: file.size,
      })
    }
    await caricaFoto()
    setUploading(false)
  }

  const eliminaFoto = async (fotoId: string, url: string) => {
    if (!confirm('Eliminare questa foto?')) return
    const path = url.split('/terreni-foto/')[1]
    await supabase.storage.from('terreni-foto').remove([path])
    await (supabase.from('terreni_foto') as any).delete().eq('id', fotoId)
    await caricaFoto()
  }

  const salva = async () => {
    if (!terreno) return
    setSaving(true)
    setSaved(false)
    const { error } = await (supabase.from('terreni') as any)
      .update({
        stato: statoSel,
        proprietario_id: propSel || null,
        note: noteAdmin || null,
      })
      .eq('id', terreno.id)
    if (!error) setSaved(true)
    else alert('Errore nel salvataggio.')
    setSaving(false)
  }

  const stampaPDF = () => {
    if (!terreno) return
    const prop = proprietari.find(p => p.id === propSel)
    const w = window.open('', '_blank')
    if (!w) return
    const score = terreno.score ?? 0
    const scoreColor = score >= 70 ? '#1a7f4e' : score >= 45 ? '#f59e0b' : '#dc2626'
    w.document.write(`<!DOCTYPE html><html lang="it"><head><meta charset="UTF-8">
<title>Report Terreno — ${terreno.comune}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Helvetica Neue',Arial,sans-serif;color:#1d1d1f;padding:48px;font-size:14px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:36px;padding-bottom:20px;border-bottom:2px solid #1a7f4e}
.logo{font-size:16px;font-weight:700;color:#1a7f4e}.logo span{display:block;font-size:11px;font-weight:400;color:#86868b;margin-top:2px}
.data{font-size:11px;color:#86868b;text-align:right}
h2{font-size:24px;font-weight:700;letter-spacing:-.03em;margin-bottom:4px}
.sub{font-size:13px;color:#86868b;margin-bottom:28px}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:24px}
.box{border:1px solid #e8e8ed;border-radius:10px;padding:18px}
.box h3{font-size:10px;font-weight:600;color:#86868b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px}
.score{font-size:48px;font-weight:700;color:${scoreColor};letter-spacing:-.04em;line-height:1}
.row{display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f5f5f7;font-size:13px}
.row:last-child{border-bottom:none}
.row .k{color:#86868b}.row .v{font-weight:500}
.green-box{background:#1a7f4e;border-radius:10px;padding:18px;color:#fff;margin-bottom:20px}
.green-box .range{font-size:22px;font-weight:700;letter-spacing:-.03em}
.green-box .lbl{font-size:10px;opacity:.7;margin-bottom:4px}
.green-box .quota{margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,.2);font-size:12px;color:rgba(255,255,255,.8)}
.coltura-prima{background:#e8f5ee;border-radius:8px;padding:12px 14px;margin-bottom:8px}
.coltura-prima .nome{font-size:16px;font-weight:700;color:#1a7f4e}
.coltura-prima .lbl{font-size:10px;color:#86868b;margin-bottom:2px}
.chip{display:inline-block;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:500;margin:2px;background:#e8f5ee;color:#1a7f4e}
.footer{margin-top:36px;padding-top:14px;border-top:1px solid #e8e8ed;font-size:10px;color:#86868b;display:flex;justify-content:space-between}
@media print{body{padding:28px}}
</style></head><body>
<div class="header">
  <div class="logo">Amalis Urban Farm 4.0<span>Ramo agricolo · Amalis Group SRL</span></div>
  <div class="data">Report Terreno<br>${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
</div>
<h2>${terreno.comune} (${terreno.provincia})</h2>
<p class="sub">${terreno.indirizzo || 'Indirizzo non specificato'}${terreno.latitudine ? ` · GPS: ${terreno.latitudine.toFixed(4)}, ${terreno.longitudine?.toFixed(4)}` : ''}${prop ? ` · Proprietario: ${prop.nome} ${prop.cognome}` : ''}</p>
<div class="grid2">
  <div class="box">
    <h3>Score complessivo</h3>
    <div class="score">${score}</div>
    <div style="font-size:12px;color:#86868b;margin-top:4px">${score >= 70 ? 'Terreno eccellente' : score >= 50 ? 'Buon potenziale' : score >= 30 ? 'Potenziale moderato' : 'Potenziale basso'}</div>
  </div>
  <div class="box">
    <h3>Dati generali</h3>
    <div class="row"><span class="k">Superficie</span><span class="v">${terreno.superficie_ha ?? '—'} ha</span></div>
    <div class="row"><span class="k">Tipo suolo</span><span class="v">${terreno.tipo_suolo || '—'}</span></div>
    <div class="row"><span class="k">Pendenza</span><span class="v">${terreno.pendenza || '—'}</span></div>
    <div class="row"><span class="k">Acqua</span><span class="v">${terreno.acqua_disponibile ? '✓ Disponibile' : '✗ No'}</span></div>
    <div class="row"><span class="k">Elettricità</span><span class="v">${terreno.elettricita_disponibile ? '✓ Disponibile' : '✗ No'}</span></div>
    <div class="row"><span class="k">Stato</span><span class="v">${STATI.find(s => s.value === terreno.stato)?.label ?? terreno.stato}</span></div>
  </div>
</div>
<h3 style="font-size:10px;font-weight:600;color:#86868b;letter-spacing:.06em;text-transform:uppercase;margin-bottom:10px">Colture consigliate</h3>
<div class="coltura-prima"><div class="lbl">✦ Coltura primaria</div><div class="nome">${terreno.coltura_primaria ?? '—'}</div></div>
<div style="display:flex;gap:8px;margin-bottom:20px">
  <div class="box" style="flex:1;padding:10px 14px"><div style="font-size:10px;color:#86868b;margin-bottom:2px">Alternativa 1</div><div style="font-size:13px;font-weight:600">${terreno.coltura_secondaria ?? '—'}</div></div>
  <div class="box" style="flex:1;padding:10px 14px"><div style="font-size:10px;color:#86868b;margin-bottom:2px">Alternativa 2</div><div style="font-size:13px;font-weight:600">${terreno.coltura_terziaria ?? '—'}</div></div>
</div>
<div class="green-box">
  <div class="lbl">Stima ricavi annui</div>
  <div class="range">€ ${terreno.ricavo_min?.toLocaleString('it') ?? '—'} – € ${terreno.ricavo_max?.toLocaleString('it') ?? '—'}</div>
  <div class="quota">Quota proprietario (20–30%): <strong>€ ${terreno.quota_min?.toLocaleString('it') ?? '—'} – € ${terreno.quota_max?.toLocaleString('it') ?? '—'} / anno</strong></div>
</div>
${noteAdmin ? `<div class="box" style="margin-bottom:20px"><h3>Note</h3><p style="font-size:13px;color:#424245;line-height:1.6">${noteAdmin}</p></div>` : ''}
<div class="footer">
  <span>Amalis Urban Farm 4.0 · amalisfarm.com · Uso riservato agli amministratori</span>
  <span>* Stime indicative basate su dati medi di mercato 2024</span>
</div>
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen" style={{ background: '#f5f5f7' }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: '#e8e8ed', borderTopColor: '#1a7f4e' }} />
    </div>
  )

  if (!terreno) return (
    <div className="flex flex-col items-center justify-center h-screen gap-3" style={{ background: '#f5f5f7' }}>
      <AlertCircle size={32} style={{ color: '#c7c7cc' }} />
      <p className="text-sm" style={{ color: '#86868b' }}>Terreno non trovato.</p>
      <button onClick={() => navigate('/terreni-valutati')} className="text-sm font-medium" style={{ color: '#1a7f4e' }}>← Torna alla lista</button>
    </div>
  )

  const score = terreno.score ?? 0
  const statoLabel = STATI.find(s => s.value === terreno.stato)?.label ?? terreno.stato

  return (
    <div className="min-height-screen" style={{ background: '#f5f5f7', minHeight: '100vh' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 px-8 py-4 flex items-center justify-between"
        style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'saturate(180%) blur(20px)', borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/terreni-valutati')}
            className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
            style={{ color: '#86868b' }}>
            <ArrowLeft size={15} /> Terreni valutati
          </button>
          <span style={{ color: '#c7c7cc' }}>/</span>
          <span className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>{terreno.comune} ({terreno.provincia})</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={stampaPDF}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border transition-all hover:bg-gray-50"
            style={{ borderColor: '#e8e8ed', color: '#424245' }}>
            <FileText size={13} /> Stampa / PDF
          </button>
          <button onClick={salva} disabled={saving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-white transition-all"
            style={{ background: saved ? '#34c759' : '#1a7f4e' }}>
            {saved ? <><CheckCircle size={13} /> Salvato</> : saving ? 'Salvataggio...' : <><Save size={13} /> Salva modifiche</>}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8 grid grid-cols-3 gap-6">

        {/* Colonna sinistra — 2/3 */}
        <div className="col-span-2 space-y-6">

          {/* Score + colture */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-start gap-6">
              <div className="flex flex-col items-center gap-2">
                <ScoreRing score={score} />
                <span className="text-xs font-medium" style={{ color: score >= 70 ? '#1a7f4e' : score >= 45 ? '#f59e0b' : '#ef4444' }}>
                  {score >= 70 ? 'Eccellente' : score >= 50 ? 'Buon potenziale' : score >= 30 ? 'Moderato' : 'Basso'}
                </span>
              </div>
              <div className="flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#86868b' }}>Colture consigliate</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ background: '#e8f5ee' }}>
                    <Leaf size={16} style={{ color: '#1a7f4e' }} />
                    <div>
                      <div className="text-xs" style={{ color: '#86868b' }}>✦ Primaria</div>
                      <div className="text-sm font-bold" style={{ color: '#1a7f4e' }}>{terreno.coltura_primaria ?? '—'}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[terreno.coltura_secondaria, terreno.coltura_terziaria].map((c, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-xl px-3 py-2.5 border text-sm" style={{ borderColor: '#e8e8ed', color: '#424245' }}>
                        <Leaf size={13} style={{ color: '#86868b' }} />
                        <span>{c ?? '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ricavi */}
          <div className="rounded-2xl p-6 shadow-sm" style={{ background: '#1a7f4e' }}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Stima ricavi annui</div>
                <div className="text-3xl font-bold text-white" style={{ letterSpacing: '-0.03em' }}>
                  € {terreno.ricavo_min?.toLocaleString('it') ?? '—'} – {terreno.ricavo_max?.toLocaleString('it') ?? '—'}
                </div>
              </div>
              <TrendingUp size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
            </div>
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.15)' }}>
              <div className="text-xs mb-1" style={{ color: 'rgba(255,255,255,0.6)' }}>Quota proprietario (20–30%)</div>
              <div className="text-xl font-bold text-white">
                € {terreno.quota_min?.toLocaleString('it') ?? '—'} – {terreno.quota_max?.toLocaleString('it') ?? '—'} / anno
              </div>
            </div>
          </div>

          {/* Dati tecnici */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: '#86868b' }}>Caratteristiche tecniche</div>
            <div className="grid grid-cols-2 gap-x-8">
              <div>
                <InfoRow label="Superficie" value={terreno.superficie_ha ? `${terreno.superficie_ha} ha` : null} />
                <InfoRow label="Tipo suolo" value={terreno.tipo_suolo} />
                <InfoRow label="pH suolo" value={terreno.ph_suolo} />
                <InfoRow label="Pendenza" value={terreno.pendenza} />
                <InfoRow label="Zona climatica" value={terreno.zona_climatica} />
              </div>
              <div>
                <InfoRow label="Accessibilità" value={terreno.accessibilita} />
                <InfoRow label="Uso precedente" value={terreno.uso_precedente} />
                <InfoRow label="Coordinate" value={terreno.latitudine ? `${terreno.latitudine.toFixed(4)}, ${terreno.longitudine?.toFixed(4)}` : null} />
                <InfoRow label="Data valutazione" value={new Date(terreno.created_at).toLocaleDateString('it-IT')} />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-4 pt-4" style={{ borderTop: '1px solid #f5f5f7' }}>
              <Chip label="Acqua" ok={!!terreno.acqua_disponibile} />
              <Chip label="Elettricità" ok={!!terreno.elettricita_disponibile} />
              <Chip label="Strutture" ok={!!terreno.strutture_esistenti} />
              <Chip label={terreno.vincoli_ambientali ? 'Vincoli presenti' : 'Nessun vincolo'} ok={!terreno.vincoli_ambientali} />
            </div>
          </div>

          {/* Note */}
          {terreno.note && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#86868b' }}>Note agronomo</div>
              <p className="text-sm leading-relaxed" style={{ color: '#424245' }}>{terreno.note}</p>
            </div>
          )}

          {/* Foto */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#86868b' }}>
                Foto del terreno ({foto.length})
              </div>
              <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all hover:opacity-80"
                style={{ background: '#1a7f4e', color: '#fff' }}>
                <Upload size={12} />
                {uploading ? 'Caricamento...' : 'Carica foto'}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={uploading}
                  onChange={e => uploadFoto(e.target.files)}
                />
              </label>
            </div>

            {foto.length === 0 ? (
              <label className="flex flex-col items-center justify-center gap-3 py-10 rounded-xl border-2 border-dashed cursor-pointer transition-all hover:border-green-400"
                style={{ borderColor: '#e8e8ed' }}>
                <Camera size={28} style={{ color: '#c7c7cc' }} />
                <span className="text-sm" style={{ color: '#86868b' }}>Nessuna foto. Clicca per caricare.</span>
                <input type="file" accept="image/*" multiple className="hidden" onChange={e => uploadFoto(e.target.files)} />
              </label>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {foto.map(f => (
                  <div key={f.id} className="relative group rounded-xl overflow-hidden aspect-square cursor-pointer"
                    style={{ background: '#f5f5f7' }}
                    onClick={() => setFotoSelezionata(f.url)}>
                    <img src={f.url} alt={f.nome ?? ''} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                      style={{ background: 'rgba(0,0,0,0.4)' }}>
                      <button
                        onClick={e => { e.stopPropagation(); eliminaFoto(f.id, f.url) }}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(239,68,68,0.9)' }}>
                        <X size={13} color="#fff" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Colonna destra — 1/3 */}
        <div className="space-y-6">

          {/* Stato */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#86868b' }}>Stato pratica</div>
            <select
              value={statoSel}
              onChange={e => { setStatoSel(e.target.value); setSaved(false) }}
              className="w-full rounded-lg border text-sm px-3 py-2 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all"
              style={{ background: '#f5f5f7', borderColor: '#e8e8ed', color: '#1d1d1f' }}
            >
              {STATI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* Associa proprietario */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#86868b' }}>Proprietario associato</div>
            {proprietari.length === 0 ? (
              <div className="text-xs rounded-lg px-3 py-2.5" style={{ background: '#f5f5f7', color: '#86868b' }}>
                Nessun proprietario registrato in piattaforma.
              </div>
            ) : (
              <>
                <select
                  value={propSel}
                  onChange={e => { setPropSel(e.target.value); setSaved(false) }}
                  className="w-full rounded-lg border text-sm px-3 py-2 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all mb-3"
                  style={{ background: '#f5f5f7', borderColor: '#e8e8ed', color: '#1d1d1f' }}
                >
                  <option value="">— nessuno —</option>
                  {proprietari.map(p => (
                    <option key={p.id} value={p.id}>{p.cognome} {p.nome}</option>
                  ))}
                </select>
                {propSel && (() => {
                  const p = proprietari.find(x => x.id === propSel)
                  return p ? (
                    <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: '#f5f5f7' }}>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold text-white" style={{ background: '#1a7f4e' }}>
                        {p.nome[0]}{p.cognome[0]}
                      </div>
                      <div>
                        <div className="text-sm font-semibold" style={{ color: '#1d1d1f' }}>{p.nome} {p.cognome}</div>
                        {p.email && <div className="text-xs" style={{ color: '#86868b' }}>{p.email}</div>}
                      </div>
                    </div>
                  ) : null
                })()}
              </>
            )}
          </div>

          {/* Note admin */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#86868b' }}>Note interne</div>
            <textarea
              value={noteAdmin}
              onChange={e => { setNoteAdmin(e.target.value); setSaved(false) }}
              rows={5}
              placeholder="Aggiungi note interne sul terreno o sul proprietario..."
              className="w-full rounded-lg border text-sm px-3 py-2 outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100 transition-all resize-none"
              style={{ background: '#f5f5f7', borderColor: '#e8e8ed', color: '#1d1d1f' }}
            />
          </div>

          {/* Info box */}
          <div className="rounded-2xl p-5" style={{ background: '#e8f5ee' }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={14} style={{ color: '#1a7f4e' }} />
              <span className="text-xs font-semibold" style={{ color: '#1a7f4e' }}>Posizione</span>
            </div>
            <div className="text-sm font-medium" style={{ color: '#1d1d1f' }}>{terreno.comune}, {terreno.provincia}</div>
            {terreno.indirizzo && <div className="text-xs mt-1" style={{ color: '#86868b' }}>{terreno.indirizzo}</div>}
            {terreno.latitudine && (
              <a
                href={`https://www.google.com/maps?q=${terreno.latitudine},${terreno.longitudine}`}
                target="_blank"
                rel="noreferrer"
                className="inline-block mt-2 text-xs font-medium" style={{ color: '#1a7f4e' }}>
                Apri in Google Maps →
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {fotoSelezionata && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setFotoSelezionata(null)}>
          <button className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <X size={20} color="#fff" />
          </button>
          <img src={fotoSelezionata} alt="" className="max-w-4xl max-h-screen object-contain rounded-xl"
            style={{ maxHeight: '90vh' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
