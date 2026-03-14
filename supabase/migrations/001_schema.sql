-- ============================================================
-- AMALIS URBAN FARM 4.0
-- Migration 001 — Schema iniziale
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES
CREATE TYPE user_role AS ENUM ('admin','agronomo','operatore','socio','visitatore');
CREATE TYPE membership_status AS ENUM ('attivo','sospeso','scaduto','in_attesa');
CREATE TYPE membership_type AS ENUM ('fondatore','ordinario','sostenitore','junior');
CREATE TYPE campo_status AS ENUM ('attivo','in_riposo','in_preparazione','dismesso');
CREATE TYPE coltura_status AS ENUM ('semina','crescita','fioritura','raccolta','completata');
CREATE TYPE attivita_tipo AS ENUM ('irrigazione','concimazione','potatura','raccolta','semina','trattamento','monitoraggio','altro');
CREATE TYPE pagamento_status AS ENUM ('pagato','in_attesa','scaduto','annullato');

-- PROFILES
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  nome TEXT NOT NULL,
  cognome TEXT NOT NULL,
  telefono TEXT,
  codice_fiscale TEXT,
  avatar_url TEXT,
  ruolo user_role NOT NULL DEFAULT 'visitatore',
  comune TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOCI
CREATE TABLE soci (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  numero_tessera TEXT UNIQUE NOT NULL,
  tipo_socio membership_type NOT NULL DEFAULT 'ordinario',
  stato membership_status NOT NULL DEFAULT 'in_attesa',
  data_iscrizione DATE NOT NULL DEFAULT CURRENT_DATE,
  data_scadenza DATE,
  quota_annuale NUMERIC(10,2) NOT NULL DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CAMPI
CREATE TABLE campi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codice TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  descrizione TEXT,
  superficie_mq NUMERIC(10,2),
  localita TEXT,
  comune TEXT NOT NULL DEFAULT 'Palermo',
  coordinate_lat NUMERIC(10,8),
  coordinate_lng NUMERIC(11,8),
  tipo_suolo TEXT,
  sistema_irrigazione TEXT,
  stato campo_status NOT NULL DEFAULT 'attivo',
  responsabile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- COLTURE
CREATE TABLE colture (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campo_id UUID NOT NULL REFERENCES campi(id) ON DELETE CASCADE,
  nome_coltura TEXT NOT NULL,
  varieta TEXT,
  stato coltura_status NOT NULL DEFAULT 'semina',
  data_semina DATE,
  data_prevista_raccolta DATE,
  data_raccolta_effettiva DATE,
  quantita_raccolta_kg NUMERIC(10,3),
  metodo_coltivazione TEXT DEFAULT 'biologico',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ATTIVITÀ
CREATE TABLE attivita (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campo_id UUID NOT NULL REFERENCES campi(id) ON DELETE CASCADE,
  coltura_id UUID REFERENCES colture(id),
  operatore_id UUID NOT NULL REFERENCES profiles(id),
  tipo attivita_tipo NOT NULL,
  titolo TEXT NOT NULL,
  descrizione TEXT,
  data_attivita TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  durata_ore NUMERIC(4,2),
  materiali_usati JSONB,
  foto_url TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODOTTI
CREATE TABLE prodotti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coltura_id UUID REFERENCES colture(id),
  nome TEXT NOT NULL,
  categoria TEXT,
  descrizione TEXT,
  unita_misura TEXT NOT NULL DEFAULT 'kg',
  quantita_disponibile NUMERIC(10,3) DEFAULT 0,
  prezzo_unitario NUMERIC(10,2),
  certificazione_bio BOOLEAN DEFAULT true,
  disponibile BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PAGAMENTI
CREATE TABLE pagamenti (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  socio_id UUID NOT NULL REFERENCES soci(id) ON DELETE CASCADE,
  importo NUMERIC(10,2) NOT NULL,
  descrizione TEXT NOT NULL,
  anno_riferimento INTEGER NOT NULL,
  stato pagamento_status NOT NULL DEFAULT 'in_attesa',
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- EVENTI
CREATE TABLE eventi (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titolo TEXT NOT NULL,
  descrizione TEXT,
  tipo TEXT DEFAULT 'evento',
  data_inizio TIMESTAMPTZ NOT NULL,
  data_fine TIMESTAMPTZ,
  luogo TEXT,
  posti_disponibili INTEGER,
  iscrizione_richiesta BOOLEAN DEFAULT false,
  aperto_pubblico BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TRIGGER tr_profiles_upd BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_soci_upd BEFORE UPDATE ON soci FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_campi_upd BEFORE UPDATE ON campi FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_colture_upd BEFORE UPDATE ON colture FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_prodotti_upd BEFORE UPDATE ON prodotti FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- AUTO-CREA PROFILE su nuovo utente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, nome, cognome, ruolo)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', 'Utente'),
    COALESCE(NEW.raw_user_meta_data->>'cognome', ''),
    COALESCE((NEW.raw_user_meta_data->>'ruolo')::user_role, 'visitatore')
  );
  RETURN NEW;
END; $$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- RLS
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE soci      ENABLE ROW LEVEL SECURITY;
ALTER TABLE campi     ENABLE ROW LEVEL SECURITY;
ALTER TABLE colture   ENABLE ROW LEVEL SECURITY;
ALTER TABLE attivita  ENABLE ROW LEVEL SECURITY;
ALTER TABLE prodotti  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pagamenti ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventi    ENABLE ROW LEVEL SECURITY;

-- HELPER ruolo
CREATE OR REPLACE FUNCTION auth_role() RETURNS user_role AS $$
  SELECT ruolo FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- POLICIES
CREATE POLICY "profiles_self"        ON profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "profiles_admin"       ON profiles FOR ALL    USING (auth_role() = 'admin');

CREATE POLICY "soci_self"  ON soci FOR SELECT USING (profile_id = auth.uid());
CREATE POLICY "soci_staff" ON soci FOR ALL    USING (auth_role() IN ('admin','agronomo'));

CREATE POLICY "campi_read"  ON campi FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "campi_write" ON campi FOR ALL    USING (auth_role() IN ('admin','agronomo'));

CREATE POLICY "colture_read"  ON colture FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "colture_write" ON colture FOR ALL    USING (auth_role() IN ('admin','agronomo','operatore'));

CREATE POLICY "prodotti_read"  ON prodotti FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "prodotti_write" ON prodotti FOR ALL    USING (auth_role() IN ('admin','agronomo'));

CREATE POLICY "pagamenti_self"  ON pagamenti FOR SELECT USING (socio_id IN (SELECT id FROM soci WHERE profile_id = auth.uid()));
CREATE POLICY "pagamenti_admin" ON pagamenti FOR ALL    USING (auth_role() = 'admin');

CREATE POLICY "eventi_read"  ON eventi FOR SELECT USING (true);
CREATE POLICY "eventi_write" ON eventi FOR ALL    USING (auth_role() IN ('admin','agronomo'));

-- INDICI
CREATE INDEX idx_soci_profile   ON soci(profile_id);
CREATE INDEX idx_colture_campo  ON colture(campo_id);
CREATE INDEX idx_attivita_campo ON attivita(campo_id);
CREATE INDEX idx_pagamenti_socio ON pagamenti(socio_id);

-- SEED CAMPI
INSERT INTO campi (codice, nome, descrizione, superficie_mq, localita, comune, tipo_suolo, sistema_irrigazione, stato) VALUES
('AUF-C001', 'Campo Mandorlo',       'Mandorli biologici varietà Avola',           2500.00, 'Contrada Portella',   'Palermo',              'Argilloso-calcareo', 'Goccia a goccia', 'attivo'),
('AUF-C002', 'Orto Biodinamico Nord','Orto sinergico per verdure di stagione',       800.00, 'Via delle Ginestre',  'Palermo',              'Sabbioso-limoso',    'Aspersione',      'attivo'),
('AUF-C003', 'Vigneto Nero d''Avola','Filari storici per produzione vinicola bio',  1800.00, 'Contrada Rocca',      'Monreale',             'Argilloso',          'Goccia a goccia', 'attivo'),
('AUF-C004', 'Serra Sperimentale',   'Serra per semenzaio e colture protette',       300.00, 'Zona Industriale',    'Palermo',              'Substrato artificiale','Nebbia ultrafine','attivo'),
('AUF-C005', 'Campo Agrumi',         'Limoneti e aranceti varietà locali siciliane',1200.00, 'Piana degli Albanesi','Piana degli Albanesi',  'Argilloso',          'Goccia a goccia', 'in_preparazione');

-- SEED PRODOTTI
INSERT INTO prodotti (nome, categoria, descrizione, unita_misura, quantita_disponibile, prezzo_unitario, certificazione_bio) VALUES
('Mandorle Avola Biologiche',  'Frutta secca', 'Mandorle varietà Avola, raccolto 2025',          'kg', 85.5,  14.00, true),
('Carciofi Violetti di Sicilia','Verdura',      'Carciofi freschi coltura biologica',             'kg', 42.0,   3.50, true),
('Olio EVO Biologico',         'Condimenti',   'Olio extravergine prima spremitura 2025',         'lt', 28.0,  12.00, true),
('Miele di Fiori Siciliani',   'Apicultura',   'Miele millefiori dal nostro apiario',            'kg', 15.0,   9.50, true),
('Agrumi Assortiti Box',       'Frutta',       'Box misto arance, limoni, mandarini bio',        'kg', 120.0,  2.80, true);

-- SEED EVENTI
INSERT INTO eventi (titolo, descrizione, tipo, data_inizio, data_fine, luogo, posti_disponibili, iscrizione_richiesta, aperto_pubblico) VALUES
('Giornata della Semina 2026',  'Workshop pratico di semina biodinamica',        'workshop',  '2026-03-21 09:00:00+01', '2026-03-21 17:00:00+01', 'Campo AUF-C002, Palermo',      20,  true,  false),
('Assemblea Annuale dei Soci',  'Approvazione bilancio e programma 2026',        'assemblea', '2026-03-15 18:00:00+01', '2026-03-15 21:00:00+01', 'Sede Amalis, Via Libertà 180', 100, true,  false),
('Open Farm Day',               'Giornata aperta: visita guidata e degustazione','evento',    '2026-04-06 10:00:00+02', '2026-04-06 18:00:00+02', 'Tutti i campi Amalis',         200, false, true),
('Corso Permacultura Base',     'Introduzione ai principi della permacultura',   'formazione','2026-04-18 09:00:00+02', '2026-04-19 17:00:00+02', 'Serra Sperimentale AUF-C004',  12,  true,  false);