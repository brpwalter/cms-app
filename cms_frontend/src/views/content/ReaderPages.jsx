import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pageApi } from '../../api';
import './ReaderPages.css';

function ReaderPages() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    pageApi.getAll()
      .then((response) => {
        if (active) setPages(response.data);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError.response?.data?.detail || 'Die Seiten konnten nicht geladen werden.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="reader-pages">
      <header className="reader-pages__header">
        <p className="reader-pages__eyebrow">CMS · Lesebereich</p>
        <h1 className="reader-pages__title">Veröffentlichte Seiten</h1>
        <p className="reader-pages__description">Hier findest du alle freigegebenen Seiten.</p>
      </header>

      {loading ? (
        <p className="reader-pages__message">Seiten werden geladen …</p>
      ) : error ? (
        <p className="reader-pages__message reader-pages__message--error" role="alert">{error}</p>
      ) : pages.length === 0 ? (
        <p className="reader-pages__message">Zurzeit sind keine Seiten veröffentlicht.</p>
      ) : (
        <ul className="reader-pages__list">
          {pages.map((page) => {
            const preview = (page.content || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            return (
              <li className="reader-pages__card" key={page.id}>
                <h2>{page.title}</h2>
                <p>{preview || 'Für diese Seite gibt es noch keine Inhaltsvorschau.'}</p>
                <Link to={`/pages/${encodeURIComponent(page.slug)}`} className="reader-pages__link">
                  Seite lesen
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}

export default ReaderPages;
