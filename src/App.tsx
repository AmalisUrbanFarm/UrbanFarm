import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './pages/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Campi from './pages/Campi'
import Colture from './pages/Colture'
import Soci from './pages/Soci'
import Prodotti from './pages/Prodotti'
import Eventi from './pages/Eventi'
import { ReactNode } from 'react'
import ValutazioneTerreno from './pages/ValutazioneTerreno'
import TerreniValutati from './pages/TerreniValutati'
import TerrenoDettaglio from './pages/TerrenoDettaglio'
import Landing from './pages/Landing'

function Guard({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, profile, loading } = useAuth()

  if (loading || (roles && !profile)) return (
    <div className="flex h-screen items-center justify-center bg-verde-900">
      <div className="text-center">
        <div className="text-5xl mb-4">🌿</div>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )

  if (!user) return <Navigate to="/login" replace />
if (roles && profile && !roles.includes(profile.ruolo)) return <Navigate to="/dashboard" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-verde-900">
      <div className="text-center">
        <div className="text-5xl mb-4">🌿</div>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
      </div>
    </div>
  )

 return (
   <Routes>
  <Route path="/" element={!user ? <Landing /> : <Navigate to="/campi" replace />} />
  <Route path="/login" element={!user ? <Login /> : <Navigate to="/" replace />} />
  <Route element={<Guard><Layout /></Guard>}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/campi" element={<Campi />} />
    <Route path="/colture" element={<Colture />} />
    <Route path="/soci" element={<Guard roles={['admin', 'agronomo']}><Soci /></Guard>} />
    <Route path="/prodotti" element={<Prodotti />} />
    <Route path="/eventi" element={<Eventi />} />
    <Route path="/valutazione-terreno" element={<Guard roles={['admin']}><ValutazioneTerreno /></Guard>} />
    <Route path="/terreni-valutati" element={<Guard roles={['admin']}><TerreniValutati /></Guard>} />
    <Route path="/terreni-valutati/:id" element={<Guard roles={['admin']}><TerrenoDettaglio /></Guard>} />
  </Route>
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}