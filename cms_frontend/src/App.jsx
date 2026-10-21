import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Ansichten (Views)
import PageView from './views/content/PageView';
import Login from './views/auth/Login';
import Register from './views/auth/Register';
import AdminDashboard from './components/AdminDashboard';
import PagePreview from './views/content/PagePreview';
import ReaderPages from './views/content/ReaderPages';
import AuthenticatedLayout from './components/AuthenticatedLayout';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* ── CONTENT UI (Öffentliche Besucherseiten) ── */}
          <Route element={<AuthenticatedLayout />}>
            <Route path="/pages/:slug" element={<PageView />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<h2>403 - Kein Zugriff auf diese Ebene</h2>} />
          <Route path="*" element={<h2>404 - Seite nicht gefunden</h2>} />

          <Route element={<ProtectedRoute allowedRoles={['ROLE_READER']} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/reader" element={<ReaderPages />} />
            </Route>
          </Route>

          {/* ── ADMIN UI (Geschützte Redaktionsbereiche) ── */}
          {/* Geschützte Redaktionsbereiche */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_EDITOR', 'ROLE_EMPLOYEE']} />}>
            <Route element={<AuthenticatedLayout />}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/pages/:slug/preview" element={<PagePreview />} />
            </Route>
          </Route>

          {/* Exklusive Routen nur für vollberechtigte ADMINS */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
            <Route path="/admin/settings" element={<h2>Systemeinstellungen (Nur für Admins)</h2>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
