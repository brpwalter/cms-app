import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Editor Styling
import API from '../../api';

function EditPage() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Bild auswählen und Preview generieren
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file)); // Erzeugt temporäre Vorschau-URL
    }
  };

  const handleSave = async () => {
    // Da wir ein Bild übertragen, nutzen wir FormData statt JSON
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content); // HTML aus dem Editor
    if (image) formData.append('file', image);

    try {
      await API.post('/admin/pages', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Seite erfolgreich gespeichert!');
    } catch (error) {
      console.error('Fehler beim Speichern', error);
    }
  };

  return (
    <div className="admin-editor" style={{ padding: '30px' }}>
      <h2>Neue Seite erstellen (Admin-Bereich)</h2>
      
      <input 
        type="text" 
        placeholder="Seitentitel" 
        value={title} 
        onChange={(e) => setTitle(e.target.value)} 
        style={{ width: '100%', padding: '10px', marginBottom: '20px' }}
      />

      {/* WYSIWYG Editor */}
      <div style={{ marginBottom: '20px', background: '#fff' }}>
        <ReactQuill theme="snow" value={content} onChange={setContent} />
      </div>

      {/* Image Upload & Preview */}
      <div style={{ marginBottom: '20px' }}>
        <label>Titelbild hochladen:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />
        
        {imagePreview && (
          <div style={{ marginTop: '10px' }}>
            <p>Vorschau:</p>
            <img src={imagePreview} alt="Preview" style={{ maxWidth: '300px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
          </div>
        )}
      </div>

      <button onClick={handleSave} style={{ padding: '10px 20px', background: '#007bff', color: '#white', border: 'none', cursor: 'pointer' }}>
        Seite veröffentlichen
      </button>
    </div>
  );
}

export default EditPage;
