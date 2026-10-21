import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../../api';

function PageView() {
  const { slug } = useParams();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/public/pages/${slug}`)
      .then(res => {
        setPage(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) return <div>Lädt...</div>;
  if (!page) return <div>404 - Seite nicht gefunden</div>;

  return (
    <article className="content-ui" style={{ maxWdth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>{page.title}</h1>
      {page.imageUrl && <img src={page.imageUrl} alt={page.title} style={{ width: '100%', height: 'auto' }} />}
      
      {/* Gefährlich, wenn Input ungeprüft ist – Spring Boot sollte XSS-Filter nutzen */}
      <div dangerouslySetInnerHTML={{ __html: page.content }} />
    </article>
  );
}

export default PageView;
