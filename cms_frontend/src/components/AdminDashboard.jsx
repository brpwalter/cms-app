import React, { useState, useEffect } from 'react';
import { pageApi } from '../api';

function AdminDashboard() {
  const [pages, setPages] = useState([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Alle vorhandenen Seiten aus dem Java-Backend laden
  const loadPages = () => {
    pageApi.getAll()
      .then(res => setPages(res.data))
      .catch(err => console.error("Fehler beim Laden:", err));
  };

  useEffect(() => {
    loadPages();
  }, []);

  // 2. Automatische Slug-Generierung aus dem Titel (z.B. "Über uns" -> "ueber-uns")
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Sonderzeichen entfernen
      .replace(/[\s_]+/g, '-');  // Leerzeichen durch Bindestrich ersetzen
    setSlug(generatedSlug);
  };

  // 3. Neue Seite an das Backend senden
  const handleSubmit = (e) => {
    e.preventDefault();
    const newPage = { title, slug, content, published: isPublished };

    pageApi.create(newPage)
      .then(() => {
        setMessage("Seite erfolgreich erstellt!");
        setTitle('');
        setSlug('');
        setContent('');
        setIsPublished(false);
        loadPages(); // Liste aktualisieren
      })
      .catch(err => {
        setMessage("Fehler beim Erstellen der Seite. Slug eventuell schon vergeben?");
        console.error(err);
      });
  };

  // 4. Seite löschen
  const handleDelete = (id) => {
    if (window.confirm("Diese Seite wirklich löschen?")) {
      pageApi.delete(id)
        .then(() => {
          setMessage("Seite gelöscht.");
          loadPages();
        })
        .catch(err => console.error("Fehler beim Löschen:", err));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
      {/* Linke Seite: Formular zum Erstellen */}
      <div className="md:col-span-1 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Neue Seite erstellen</h2>
        {message && <div className="mb-4 p-2 bg-blue-100 text-blue-800 text-sm rounded">{message}</div>}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Titel</label>
            <input type="text" value={title} onChange={handleTitleChange} required className="w-full border p-2 rounded" placeholder="z.B. Über uns" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">URL-Slug (automatisch)</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full border p-2 rounded bg-gray-50" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Inhalt (HTML erlaubt)</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="5" className="w-full border p-2 rounded" placeholder="<p>Willkommen auf unserer Seite...</p>"></textarea>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} id="published" />
            <label htmlFor="published" className="text-sm font-medium">Sofort veröffentlichen</label>
          </div>
          <button type="submit" className="bg-green-600 text-white p-2 rounded hover:bg-green-700">Seite speichern</button>
        </form>
      </div>

      {/* Rechte Seite: Tabelle aller existierenden Seiten */}
      <div className="md:col-span-2 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-bold mb-4">Vorhandene Seiten</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="p-2">Titel</th>
                <th className="p-2">Pfad/Slug</th>
                <th className="p-2">Status</th>
                <th className="p-2">Aktionen</th>
              </tr>
            </thead>
            <tbody>
              {pages.map(p => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{p.title}</td>
                  <td className="p-2 text-gray-500">/{p.slug}</td>
                  <td className="p-2">
                    <span className={`px-2 py-1 rounded text-xs ${p.published ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {p.published ? 'Veröffentlicht' : 'Entwurf'}
                    </span>
                  </td>
                  <td className="p-2">
                    <button onClick={() => handleDelete(p.id)} className="text-red-600 hover:underline">Löschen</button>
                  </td>
                </tr>
              ))}
              {pages.length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">Noch keine Seiten angelegt.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
