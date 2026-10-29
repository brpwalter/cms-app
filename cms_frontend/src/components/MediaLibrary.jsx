import { useEffect, useState } from 'react';
import { mediaApi } from '../api';
import './MediaLibrary.css';

const formatFileSize = (size) => {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

function MediaLibrary({ isOpen, canDelete, onClose, onSelect }) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');

  const loadMedia = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await mediaApi.getAll();
      setMedia(response.data);
    } catch (loadError) {
      setError('Medien konnten nicht geladen werden. Bitte prüfe Anmeldung und Serververbindung.');
      console.error('Fehler beim Laden der Medienbibliothek:', loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) loadMedia();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredMedia = media.filter((asset) => asset.name.toLowerCase().includes(search.trim().toLowerCase()));

  const handleUpload = async (event) => {
    const [file] = event.target.files;
    event.target.value = '';
    if (!file) return;

    setUploading(true);
    setError('');
    setMessage('');
    try {
      const response = await mediaApi.upload(file);
      setMedia((items) => [response.data, ...items]);
      setMessage('Bild wurde in die Medienbibliothek hochgeladen.');
    } catch (uploadError) {
      const status = uploadError.response?.status;
      const serverMessage = uploadError.response?.data?.detail || uploadError.response?.data?.message;
      setError(serverMessage || (status === 413
        ? 'Das Bild ist größer als 10 MB.'
        : status === 415
          ? 'Erlaubt sind JPEG-, PNG-, GIF- und WebP-Bilder.'
          : 'Bild konnte nicht hochgeladen werden.'));
      console.error('Fehler beim Hochladen eines Mediums:', uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset) => {
    if (!window.confirm(`„${asset.name}“ wirklich löschen? Bereits eingefügte Bilder werden dann nicht mehr angezeigt.`)) {
      return;
    }

    setError('');
    setMessage('');
    try {
      await mediaApi.delete(asset.name);
      setMedia((items) => items.filter((item) => item.name !== asset.name));
      setMessage('Medium wurde gelöscht.');
    } catch (deleteError) {
      const status = deleteError.response?.status;
      setError(status
        ? `Medium konnte nicht gelöscht werden (HTTP ${status}).`
        : 'Backend nicht erreichbar. Medium konnte nicht gelöscht werden.');
      console.error('Fehler beim Löschen eines Mediums:', deleteError);
    }
  };

  return (
    <div className="media-library__backdrop" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        className="media-library"
        role="dialog"
        aria-modal="true"
        aria-labelledby="media-library-title"
      >
        <header className="media-library__header">
          <div>
            <h2 id="media-library-title">Medienbibliothek</h2>
            <p>Bilder auswählen oder neue Bilder hochladen. Erlaubt: JPEG, PNG, GIF, WebP bis 10 MB.</p>
          </div>
          <button type="button" className="admin-button admin-button--secondary" onClick={onClose} aria-label="Medienbibliothek schließen">
            Schließen
          </button>
        </header>

        <div className="media-library__toolbar">
          <label className="admin-button admin-button--primary media-library__upload">
            {uploading ? 'Wird hochgeladen …' : 'Bild hochladen'}
            <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleUpload} disabled={uploading} />
          </label>
          <button type="button" className="admin-button admin-button--preview" onClick={loadMedia} disabled={loading}>
            {loading ? 'Wird geladen …' : 'Aktualisieren'}
          </button>
          <input
            type="search"
            className="media-library__search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Medien suchen"
            aria-label="Medienbibliothek durchsuchen"
          />
        </div>

        {(error || message) && (
          <p className={`media-library__notice ${error ? 'media-library__notice--error' : 'media-library__notice--success'}`} role={error ? 'alert' : 'status'}>
            {error || message}
          </p>
        )}

        {loading ? (
          <p className="media-library__empty">Medien werden geladen …</p>
        ) : media.length === 0 ? (
          <p className="media-library__empty">Noch keine Bilder vorhanden.</p>
        ) : filteredMedia.length === 0 ? (
          <p className="media-library__empty">Keine passenden Medien gefunden.</p>
        ) : (
          <div className="media-library__grid">
            {filteredMedia.map((asset) => (
              <article className="media-library__item" key={asset.name}>
                <img src={asset.url} alt="" loading="lazy" />
                <div className="media-library__details">
                  <span className="media-library__name" title={asset.name}>{asset.name}</span>
                  <span>{formatFileSize(asset.size)}</span>
                </div>
                <div className="media-library__actions">
                  <button type="button" className="admin-button admin-button--primary" onClick={() => onSelect(asset)}>
                    In Beitrag einfügen
                  </button>
                  {canDelete && (
                    <button type="button" className="admin-button admin-button--danger" onClick={() => handleDelete(asset)}>
                      Löschen
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default MediaLibrary;
