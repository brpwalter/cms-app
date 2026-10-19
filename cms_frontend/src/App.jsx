import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DynamicPageView from './components/DynamicPageView';
import AdminDashboard from './components/AdminDashboard'; // HIER IMPORTIERT

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow p-4 flex gap-6">
          <Link to="/" className="font-bold text-xl text-gray-800 mr-4">Mein CMS</Link>
          <Link to="/" className="text-blue-600 hover:text-blue-800 pt-1">Startseite</Link>
          <Link to="/admin" className="text-blue-600 hover:text-blue-800 pt-1">Admin-Dashboard</Link>
        </nav>

        <main className="container mx-auto p-4">
          <Routes>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/:slug" element={<DynamicPageView />} />
            <Route path="/" element={
              <div className="p-6 bg-white rounded shadow max-w-xl mx-auto mt-10 text-center">
                <h1 className="text-2xl font-bold mb-2">Willkommen im CMS!</h1>
                <p className="text-gray-600 mb-4">Wechseln Sie zum Admin-Dashboard, um erste Inhalte anzulegen.</p>
                <Link to="/admin" className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Zum Dashboard</Link>
              </div>
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
