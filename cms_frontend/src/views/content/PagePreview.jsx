import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { pageApi } from '../../api';
import './PagePreview.css';

function PagePreview() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    pageApi.preview(slug)
      .then((response) => {
        if (active) setPage(response.data);
      })
      .catch((requestError) => {
        if (!active) return;
        const status = requestError.response?.status;
        if (status === 401) {
          setError('Dein Login-Token ist ungültig oder abgelaufen. Bitte melde dich erneut an.');
        } else if (status === 403) {
          setError('Der Vorschauzugriff wurde verweigert. Bitte starte das Backend mit dem aktuellen Code neu und melde dich als ADMIN oder EDITOR an.');
        } else if (status === 404) {
          setError('Die Seite oder der Vorschau-Endpunkt wurde nicht gefunden. Bitte starte das Backend neu und prüfe den Seiten-Slug.');
        } else {
          setError('Die Vorschau konnte nicht geladen werden. Bitte prüfe, ob das Backend auf Port 8080 läuft.');
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  return (
    <main className="page-preview">
      <div className="page-preview__toolbar">
        <Link to="/admin" className="page-preview__back">Zurück zur Verwaltung</Link>
        <span className="page-preview__label">Vorschau · nur für Redakteure sichtbar</span>
      </div>

      {loading ? (
        <p className="page-preview__message">Vorschau wird geladen …</p>
      ) : error ? (
        <p className="page-preview__message page-preview__message--error" role="alert">{error}</p>
      ) : (
        <article className="page-preview__content">
          {!page.published && <p className="page-preview__draft">Entwurf – nicht öffentlich sichtbar</p>}
          <h1>{page.title}</h1>
          <div dangerouslySetInnerHTML={{ __html: page.content || '' }} />
        </article>
      )}
    </main>
  );
}

export default PagePreview;
