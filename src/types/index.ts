export type UserRole = 'admin' | 'agronomo' | 'operatore' | 'socio' | 'visitatore'
export type MembershipStatus = 'attivo' | 'sospeso' | 'scaduto' | 'in_attesa'
export type MembershipType = 'fondatore' | 'ordinario' | 'sostenitore' | 'junior'
export type CampoStatus = 'attivo' | 'in_riposo' | 'in_preparazione' | 'dismesso'
export type ColturaStatus = 'semina' | 'crescita' | 'fioritura' | 'raccolta' | 'completata'
export type AttivitaTipo = 'irrigazione' | 'concimazione' | 'potatura' | 'raccolta' | 'semina' | 'trattamento' | 'monitoraggio' | 'altro'

export interface Profile {
  id: string
  email: string
  nome: string
  cognome: string
  telefono?: string
  codice_fiscale?: string
  avatar_url?: string
  ruolo: UserRole
  comune?: string
  created_at: string
  updated_at: string
  soci?: Socio
}

export interface Socio {
  id: string
  profile_id: string
  numero_tessera: string
  tipo_socio: MembershipType
  stato: MembershipStatus
  data_iscrizione: string
  data_scadenza?: string
  quota_annuale: number
  created_at: string
  updated_at: string
  profiles?: Profile
}

export interface Campo {
  id: string
  codice: string
  nome: string
  descrizione?: string
  superficie_mq?: number
  localita?: string
  comune: string
  coordinate_lat?: number
  coordinate_lng?: number
  tipo_suolo?: string
  sistema_irrigazione?: string
  stato: CampoStatus
  responsabile_id?: string
  created_at: string
  updated_at: string
  colture?: { count: number }[]
}

export interface Coltura {
  id: string
  campo_id: string
  nome_coltura: string
  varieta?: string
  stato: ColturaStatus
  data_semina?: string
  data_prevista_raccolta?: string
  data_raccolta_effettiva?: string
  quantita_raccolta_kg?: number
  metodo_coltivazione?: string
  created_at: string
  updated_at: string
  campi?: { nome: string; codice: string }
}

export interface Attivita {
  id: string
  campo_id: string
  coltura_id?: string
  operatore_id: string
  tipo: AttivitaTipo
  titolo: string
  descrizione?: string
  data_attivita: string
  durata_ore?: number
  foto_url?: string[]
  created_at: string
  campi?: { nome: string }
  colture?: { nome_coltura: string }
  profiles?: { nome: string; cognome: string }
}

export interface Prodotto {
  id: string
  coltura_id?: string
  nome: string
  categoria?: string
  descrizione?: string
  unita_misura: string
  quantita_disponibile: number
  prezzo_unitario?: number
  immagine_url?: string
  certificazione_bio: boolean
  disponibile: boolean
  created_at: string
  updated_at: string
}

export interface Evento {
  id: string
  titolo: string
  descrizione?: string
  tipo: string
  data_inizio: string
  data_fine?: string
  luogo?: string
  posti_disponibili?: number
  iscrizione_richiesta: boolean
  aperto_pubblico: boolean
  created_at: string
}