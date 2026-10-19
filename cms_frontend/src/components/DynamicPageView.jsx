import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { pageApi } from '../api';

const DynamicPageView = () => {
    const { slug } = useParams();
    const [page, setPage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            try {
                setLoading(true);
                const response = await pageApi.getBySlug(slug || 'home');
                setPage(response.data);
                setError(false);
            } catch (err) {
                setError(true);
            } finally {
                setLoading(false);
            }
        };
        fetchPage();
    }, [slug]);

    if (loading) return <div>Loading content...</div>;
    if (error || !page) return <div>404 - Page Not Found</div>;

    return (
        <article style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
            <h1>{page.title}</h1>
            <hr />
            {/* Inject safe HTML content from database */}
            <div dangerouslySetInnerHTML={{ __html: page.content }} />
        </article>
    );
};

export default DynamicPageView;
