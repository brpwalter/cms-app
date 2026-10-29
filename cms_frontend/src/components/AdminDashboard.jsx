import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { pageApi, userApi } from '../api';
import { useAuth } from '../context/AuthContext';
import MediaLibrary from './MediaLibrary';
import './AdminDashboard.css';

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

function AdminDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('ROLE_ADMIN');
  const isEditor = user?.roles?.includes('ROLE_EDITOR');
  const isEmployee = user?.roles?.includes('ROLE_EMPLOYEE');
  const [pages, setPages] = useState([]);
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('');
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingPageStatus, setEditingPageStatus] = useState(null);
  const [editingPageComments, setEditingPageComments] = useState([]);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const editorRef = useRef(null);
  const [reviewPageId, setReviewPageId] = useState(null);
  const [reviewAction, setReviewAction] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewPageContent, setReviewPageContent] = useState('');
  const [reviewComments, setReviewComments] = useState([]);
  const [selectedReviewRange, setSelectedReviewRange] = useState(null);
  const [selectedReviewText, setSelectedReviewText] = useState('');
  const [newCommentFeedback, setNewCommentFeedback] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [savingUserId, setSavingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);

  const loadPages = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await pageApi.getAll();
      setPages(response.data);
    } catch (loadError) {
      setError('Seiten konnten nicht geladen werden. Bitte prüfe deine Anmeldung und die Serververbindung.');
      console.error('Fehler beim Laden der Seiten:', loadError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) loadPages();
  }, [isAdmin]);

  const loadUsers = async () => {
    setUsersLoading(true);
    setError('');
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (loadError) {
      setError('Benutzer konnten nicht geladen werden.');
      console.error('Fehler beim Laden der Benutzer:', loadError);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    const generatedSlug = val
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-');
    setSlug(generatedSlug);
  };

  const handleInsertMedia = (asset) => {
    const editor = editorRef.current?.getEditor();
    if (!editor) {
      setError('Der Beitragseditor ist momentan nicht verfügbar.');
      return;
    }
    const selection = editor.getSelection(true);
    const index = selection ? selection.index : editor.getLength() - 1;
    editor.insertEmbed(index, 'image', asset.url, 'user');
    editor.setSelection(index + 1, 0, 'user');
    setMediaLibraryOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const pageData = { title, slug, content, published: !isEmployee && isPublished };

    try {
      if (editingPageId !== null) {
        await pageApi.update(editingPageId, pageData);
        setMessage(editingPageStatus === 'PENDING_APPROVAL'
          ? 'Beitrag wurde bearbeitet und bleibt zur Freigabe ausstehend.'
          : 'Überarbeiteter Beitrag wurde erneut zur Freigabe vorgelegt.');
        setEditingPageId(null);
        setEditingPageStatus(null);
        setEditingPageComments([]);
      } else {
        await pageApi.create(pageData);
        setMessage(isEmployee
          ? 'Beitrag wurde zur Freigabe an den Editor übermittelt.'
          : isPublished ? 'Beitrag veröffentlicht.' : 'Beitrag als Entwurf gespeichert.');
      }
      setTitle('');
      setSlug('');
      setContent('');
      setIsPublished(false);
      await loadPages();
    } catch (submitError) {
      setError(editingPageId !== null
        ? 'Korrektur konnte nicht eingereicht werden. Prüfe, ob der Slug bereits vergeben ist.'
        : 'Seite konnte nicht erstellt werden. Der Slug ist möglicherweise bereits vergeben.');
      console.error('Fehler beim Speichern des Beitrags:', submitError);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Diese Seite wirklich löschen?')) {
      setMessage('');
      setError('');
      try {
        await pageApi.delete(id);
        setMessage('Seite gelöscht.');
        await loadPages();
      } catch (deleteError) {
        setError('Seite konnte nicht gelöscht werden.');
        console.error('Fehler beim Löschen der Seite:', deleteError);
      }
    }
  };

  const handleApprove = async (id) => {
    setMessage('');
    setError('');
    try {
      await pageApi.approve(id);
      setMessage('Beitrag freigegeben und veröffentlicht.');
      await loadPages();
    } catch (approveError) {
      setError('Beitrag konnte nicht freigegeben werden.');
      console.error('Fehler beim Freigeben des Beitrags:', approveError);
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setReviewError('');
    if (reviewAction === 'reject' && !reviewFeedback.trim()) {
      setReviewError('Bitte gib eine Begründung ein, bevor du sie sendest.');
      return;
    }
    if (reviewAction === 'changes' && reviewComments.length === 0) {
      setReviewError('Bitte markiere mindestens eine Textstelle und füge einen Kommentar hinzu.');
      return;
    }

    setReviewSubmitting(true);
    try {
      if (reviewAction === 'reject') {
        await pageApi.reject(reviewPageId, reviewFeedback.trim());
        setMessage('Beitrag wurde mit Begründung abgelehnt.');
      } else {
        await pageApi.requestChanges(reviewPageId, reviewComments);
        setMessage('Korrekturkommentare wurden an den Mitarbeiter zurückgesendet.');
      }
      setReviewPageId(null);
      setReviewAction('');
      setReviewFeedback('');
      setReviewComments([]);
      setReviewPageContent('');
      setSelectedReviewRange(null);
      setSelectedReviewText('');
      setNewCommentFeedback('');
      await loadPages();
    } catch (reviewError) {
      const responseData = reviewError.response?.data;
      const serverMessage = responseData?.detail || responseData?.message
        || (typeof responseData === 'string' ? responseData : '');
      const status = reviewError.response?.status;
      setReviewError(serverMessage || (status
        ? `Rückmeldung konnte nicht gesendet werden (HTTP ${status}). Bitte prüfe den Server und versuche es erneut.`
        : 'Backend nicht erreichbar. Bitte prüfe die Serververbindung und versuche es erneut.'));
      console.error('Fehler bei der Beitragsprüfung:', reviewError);
    } finally {
      setReviewSubmitting(false);
    }
  };

  const openReview = (page, action) => {
    setReviewPageId(page.id);
    setReviewAction(action);
    setReviewFeedback('');
    setReviewPageContent(page.content || '');
    setReviewComments([]);
    setSelectedReviewRange(null);
    setSelectedReviewText('');
    setNewCommentFeedback('');
    setReviewError('');
  };

  const handleAddReviewComment = () => {
    if (!selectedReviewRange || !selectedReviewText.trim() || !newCommentFeedback.trim()) {
      setReviewError('Markiere eine Textstelle und gib einen Kommentar dazu ein.');
      return;
    }
    setReviewComments((comments) => [...comments, {
      ...selectedReviewRange,
      selectedText: selectedReviewText,
      feedback: newCommentFeedback.trim(),
    }]);
    setNewCommentFeedback('');
    setReviewError('');
  };

  const handleEditCorrection = (page) => {
    setEditingPageId(page.id);
    setEditingPageStatus(page.approvalStatus);
    setEditingPageComments(page.correctionComments || []);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content || '');
    setIsPublished(false);
    setMessage('');
    setError('');
  };

  const handleEditPendingPage = (page) => {
    setEditingPageId(page.id);
    setEditingPageStatus(page.approvalStatus);
    setEditingPageComments(page.correctionComments || []);
    setTitle(page.title);
    setSlug(page.slug);
    setContent(page.content || '');
    setIsPublished(false);
    setMessage('');
    setError('');
  };

  const handleCancelEdit = () => {
    setEditingPageId(null);
    setEditingPageStatus(null);
    setTitle('');
    setSlug('');
    setContent('');
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setCreatingUser(true);
    try {
      await userApi.create({
        ...newUser,
        username: newUser.username.trim(),
        email: newUser.email.trim(),
      });
      setMessage('Benutzer wurde angelegt.');
      setNewUser({ username: '', email: '', password: '', role: 'ROLE_EMPLOYEE' });
      await loadUsers();
    } catch (createError) {
      const responseData = createError.response?.data;
      const serverMessage = responseData?.detail || responseData?.message
        || (typeof responseData === 'string' ? responseData : '');
      const status = createError.response?.status;
      const fallbackMessage = !createError.response
        ? 'Backend nicht erreichbar oder Browser blockiert die Anfrage (CORS). Bitte Backend neu starten und erneut versuchen.'
        : status === 401
          ? 'Anmeldung abgelaufen. Bitte melde dich erneut an.'
          : status === 403
            ? 'Nur ein Administrator darf Benutzer anlegen.'
            : status === 409
              ? 'Benutzername oder E-Mail-Adresse ist bereits vergeben.'
              : status === 400
                ? 'Eingaben ungültig. Prüfe E-Mail-Adresse, Rolle und Passwortlänge (8–72 Zeichen).'
                : `Benutzer konnte nicht angelegt werden (HTTP ${status}).`;
      setError(serverMessage || fallbackMessage);
      console.error('Fehler beim Anlegen des Benutzers:', createError);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditUser = (managedUser) => {
    setError('');
    setEditingUser({ ...managedUser });
  };

  const handleSaveUser = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');
    setSavingUserId(editingUser.id);
    try {
      await userApi.update(editingUser.id, {
        username: editingUser.username.trim(),
        email: editingUser.email.trim(),
        role: editingUser.role,
      });
      setMessage('Benutzerdaten wurden aktualisiert.');
      setEditingUser(null);
      await loadUsers();
    } catch (updateError) {
      const responseData = updateError.response?.data;
      setError(responseData?.detail || responseData?.message
        || (typeof responseData === 'string' ? responseData : 'Benutzer konnte nicht aktualisiert werden.'));
      console.error('Fehler beim Bearbeiten des Benutzers:', updateError);
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (managedUser) => {
    if (!window.confirm(`Benutzer „${managedUser.username}“ wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }
    setMessage('');
    setError('');
    setDeletingUserId(managedUser.id);
    try {
      await userApi.delete(managedUser.id);
      setMessage(`Benutzer „${managedUser.username}“ wurde gelöscht.`);
      if (editingUser?.id === managedUser.id) setEditingUser(null);
      await loadUsers();
    } catch (deleteError) {
      const responseData = deleteError.response?.data;
      setError(responseData?.detail || responseData?.message
        || (typeof responseData === 'string' ? responseData : 'Benutzer konnte nicht gelöscht werden.'));
      console.error('Fehler beim Löschen des Benutzers:', deleteError);
    } finally {
      setDeletingUserId(null);
    }
  };

  const statusLabel = (page) => {
    switch (page.approvalStatus) {
      case 'PENDING_APPROVAL': return 'Freigabe ausstehend';
      case 'CHANGES_REQUESTED': return 'Korrektur angefordert';
      case 'REJECTED': return 'Abgelehnt';
      case 'PUBLISHED': return 'Veröffentlicht';
      default: return 'Entwurf';
    }
  };

  const roleLabel = (role) => ({
    ROLE_ADMIN: 'Administrator',
    ROLE_EDITOR: 'Editor',
    ROLE_EMPLOYEE: 'Mitarbeiter',
    ROLE_READER: 'Leser',
  }[role] || role);
  const pendingPages = pages.filter((page) => page.approvalStatus === 'PENDING_APPROVAL');
  const displayedPages = isEditor
    ? [...pages].sort((left, right) => Number(right.approvalStatus === 'PENDING_APPROVAL')
      - Number(left.approvalStatus === 'PENDING_APPROVAL'))
    : pages;

  return (
    <main className="admin-dashboard">
      <header className="admin-dashboard__header">
        <div>
          <p className="admin-dashboard__eyebrow">CMS-Verwaltung</p>
          <h1 className="admin-dashboard__title">{isAdmin ? 'Benutzerverwaltung' : isEditor ? 'Redaktion' : 'Mitarbeiterbereich'}</h1>
          <p className="admin-dashboard__subtitle">
            {isAdmin
              ? 'Lege Benutzerkonten an und verwalte deren Rollen.'
              : isEmployee
                ? 'Schreibe Beiträge und beantrage ihre Freigabe beim Editor.'
                : 'Prüfe ausstehende Freigaben und erstelle Seiten.'}
          </p>
        </div>
      </header>

      {(message || error) && (
        <div className={`admin-dashboard__notice ${error ? 'admin-dashboard__notice--error' : 'admin-dashboard__notice--success'}`} role={error ? 'alert' : 'status'}>
          {error || message}
        </div>
      )}
      {!isAdmin && <div className="admin-dashboard__grid">
        <section className="admin-card" aria-labelledby="create-page-title">
          <div className="admin-card__header">
            <h2 id="create-page-title" className="admin-card__title">
              {editingPageId !== null
                ? editingPageStatus === 'PENDING_APPROVAL' && isEditor ? 'Beitrag korrigieren' : 'Beitrag überarbeiten'
                : 'Neuen Beitrag schreiben'}
            </h2>
            <p className="admin-card__description">
              {editingPageId !== null
                ? editingPageStatus === 'PENDING_APPROVAL' && isEditor
                  ? 'Bearbeite den eingereichten Beitrag. Nach dem Speichern bleibt er unveröffentlicht und muss separat freigegeben werden.'
                  : `${editingPageStatus === 'REJECTED' ? 'Überarbeite den abgelehnten Beitrag anhand der Begründung' : 'Passe den Beitrag anhand des Korrekturvorschlags an'} und reiche ihn erneut zur Freigabe ein.`
                : isEmployee ? 'Der Beitrag wird nach dem Speichern dem Editor zur Freigabe vorgelegt.' : 'Erstelle einen Beitrag oder veröffentliche ihn direkt.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="admin-form">
            <div className="admin-form__field">
              <label htmlFor="page-title">Beitragstitel</label>
              <input id="page-title" type="text" value={title} onChange={handleTitleChange} required placeholder="z. B. Über uns" />
            </div>
            <div className="admin-form__field">
              <label htmlFor="page-slug">URL-Slug</label>
              <input id="page-slug" type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required />
              <span className="admin-form__hint">Wird automatisch aus dem Titel erstellt.</span>
            </div>
            <div className="admin-form__field">
              <div className="admin-form__field-header">
                <label htmlFor="page-content">Inhalt</label>
                <button
                  type="button"
                  className="admin-button admin-button--preview"
                  onClick={() => setMediaLibraryOpen(true)}
                >
                  Medienbibliothek
                </button>
              </div>
              <div className="admin-form__editor">
                <ReactQuill ref={editorRef} theme="snow" value={content} onChange={setContent} />
              </div>
            </div>
            {editingPageId !== null && editingPageComments.length > 0 && (
              <section className="admin-correction-comments" aria-label="Korrekturkommentare des Editors">
                <h3>Korrekturkommentare des Editors</h3>
                {editingPageComments.map((comment, index) => (
                  <button
                    type="button"
                    className="admin-correction-comment"
                    key={`${comment.startIndex}-${index}`}
                    onClick={() => editorRef.current?.getEditor().setSelection(
                      comment.startIndex,
                      comment.endIndex - comment.startIndex,
                      'user',
                    )}
                  >
                    <span className="admin-correction-comment__quote">„{comment.selectedText}“</span>
                    <span>{comment.feedback}</span>
                    <span className="admin-form__hint">Klicken, um die Stelle im Beitrag zu markieren</span>
                  </button>
                ))}
              </section>
            )}
            {!isEmployee && !(isEditor && editingPageStatus === 'PENDING_APPROVAL') && (
              <label className="admin-form__checkbox">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                <span>Sofort veröffentlichen</span>
              </label>
            )}
            <div className="admin-form__actions">
              <button type="submit" className="admin-button admin-button--primary">
                {editingPageId !== null
                  ? editingPageStatus === 'PENDING_APPROVAL' && isEditor ? 'Änderungen speichern' : 'Beitrag erneut einreichen'
                  : isEmployee ? 'Freigabe beantragen' : 'Beitrag speichern'}
              </button>
              {editingPageId !== null && (
                <button type="button" className="admin-button admin-button--preview" onClick={handleCancelEdit}>
                  Abbrechen
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="admin-card" aria-labelledby="pages-list-title">
          <div className="admin-card__header admin-card__header--row">
            <div>
              <h2 id="pages-list-title" className="admin-card__title">Beiträge</h2>
              <p className="admin-card__description">
                {isEmployee ? 'Deine Beiträge und deren Freigabestatus.' : 'Ausstehende Freigaben und veröffentlichte Seiten.'}
              </p>
            </div>
            <div className="admin-card__header-actions">
              <button
                type="button"
                className="admin-button admin-button--preview"
                onClick={loadPages}
                disabled={loading}
              >
                {loading ? 'Wird aktualisiert …' : 'Aktualisieren'}
              </button>
              <span className="admin-dashboard__count">
                {isEditor ? `${pendingPages.length} offen` : pages.length}
              </span>
            </div>
          </div>

          {loading ? (
            <p className="admin-dashboard__empty">Seiten werden geladen …</p>
          ) : pages.length === 0 ? (
            <p className="admin-dashboard__empty">Noch keine Seiten angelegt.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Titel</th>
                    <th scope="col">Autor</th>
                    <th scope="col">Status</th>
                    <th scope="col">Erstellt / aktualisiert</th>
                    <th scope="col"><span className="sr-only">Aktionen</span></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPages.map((page) => (
                    <React.Fragment key={page.id}>
                    <tr>
                      <td className="admin-table__title">{page.title}</td>
                      <td>{page.authorUsername || '—'}</td>
                      <td>
                        <span className={`admin-status ${page.published ? 'admin-status--published' : page.approvalStatus === 'PENDING_APPROVAL' || page.approvalStatus === 'CHANGES_REQUESTED' ? 'admin-status--pending' : page.approvalStatus === 'REJECTED' ? 'admin-status--rejected' : 'admin-status--draft'}`}>
                          {statusLabel(page)}
                        </span>
                        {page.correctionFeedback && (
                          <p className="admin-table__feedback">
                            <strong>{page.approvalStatus === 'REJECTED' ? 'Begründung des Editors:' : 'Rückmeldung des Editors:'}</strong>
                            {' '}{page.correctionFeedback}
                          </p>
                        )}
                        {page.correctionComments?.map((comment, index) => (
                          <div className="admin-table__feedback" key={`${comment.startIndex}-${index}`}>
                            <strong>Markierte Textstelle:</strong>
                            <blockquote className="admin-correction-comment__quote">„{comment.selectedText}“</blockquote>
                            <strong>Korrekturhinweis:</strong> {comment.feedback}
                          </div>
                        ))}
                      </td>
                      <td className="admin-table__dates">
                        <div><span>Erstellt:</span> <time dateTime={page.createdAt}>{formatDateTime(page.createdAt)}</time></div>
                        <div><span>Aktualisiert:</span> <time dateTime={page.updatedAt}>{formatDateTime(page.updatedAt)}</time></div>
                      </td>
                      <td className="admin-table__actions">
                        <div className="admin-table__action-group">
                          <Link
                            className="admin-button admin-button--preview"
                            to={`/admin/pages/${encodeURIComponent(page.slug)}/preview`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Vorschau
                          </Link>
                          {(isAdmin || isEditor || (isEmployee && page.approvalStatus !== 'PUBLISHED')) && (
                            <button type="button" className="admin-button admin-button--danger" onClick={() => handleDelete(page.id)}>
                              Löschen
                            </button>
                          )}
                          {(isAdmin || isEditor) && page.approvalStatus === 'PENDING_APPROVAL' && (
                            <>
                              {isEditor && (
                                <button type="button" className="admin-button admin-button--preview" onClick={() => handleEditPendingPage(page)}>
                                  Bearbeiten
                                </button>
                              )}
                              <button type="button" className="admin-button admin-button--primary" onClick={() => handleApprove(page.id)}>
                                Freigeben
                              </button>
                              <button type="button" className="admin-button admin-button--preview" onClick={() => {
                                openReview(page, 'changes');
                              }}>
                                Korrektur anfordern
                              </button>
                              <button type="button" className="admin-button admin-button--danger" onClick={() => {
                                openReview(page, 'reject');
                              }}>
                                Ablehnen
                              </button>
                            </>
                          )}
                          {isEmployee && (page.approvalStatus === 'CHANGES_REQUESTED' || page.approvalStatus === 'REJECTED') && (
                            <button type="button" className="admin-button admin-button--primary" onClick={() => handleEditCorrection(page)}>
                              {page.approvalStatus === 'REJECTED' ? 'Beitrag überarbeiten' : 'Korrektur bearbeiten'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {reviewPageId === page.id && (
                      <tr>
                        <td colSpan={5}>
                          <form className="admin-review-form" onSubmit={handleReviewSubmit} noValidate>
                            {reviewAction === 'reject' ? (
                              <label className="admin-form__field">
                                <span>Begründung für die Ablehnung (Pflichtfeld)</span>
                                <textarea
                                  value={reviewFeedback}
                                  onChange={(event) => {
                                    setReviewFeedback(event.target.value);
                                    setReviewError('');
                                  }}
                                  required
                                  aria-invalid={Boolean(reviewError)}
                                  aria-describedby={reviewError ? `review-error-${page.id}` : undefined}
                                />
                              </label>
                            ) : (
                              <>
                                <p className="admin-form__hint">Markiere einen oder mehrere Textabschnitte. Für jede Markierung kannst du einen Kommentar hinzufügen.</p>
                                <div className="admin-form__editor admin-review-form__editor">
                                  <ReactQuill
                                    theme="snow"
                                    value={reviewPageContent}
                                    readOnly
                                    modules={{ toolbar: false }}
                                    onChangeSelection={(range, _source, quillEditor) => {
                                      if (range && range.length > 0) {
                                        setSelectedReviewRange({
                                          startIndex: range.index,
                                          endIndex: range.index + range.length,
                                        });
                                        setSelectedReviewText(quillEditor.getText(range.index, range.length));
                                        setReviewError('');
                                      } else if (range) {
                                        setSelectedReviewRange(null);
                                        setSelectedReviewText('');
                                      }
                                    }}
                                  />
                                </div>
                                <p className="admin-form__hint">
                                  {selectedReviewText.trim()
                                    ? `Ausgewählt: „${selectedReviewText.trim()}“`
                                    : 'Wähle im Beitrag mit der Maus eine Textstelle aus.'}
                                </p>
                                <label className="admin-form__field">
                                  <span>Kommentar zur markierten Textstelle</span>
                                  <textarea
                                    value={newCommentFeedback}
                                    onChange={(event) => {
                                      setNewCommentFeedback(event.target.value);
                                      setReviewError('');
                                    }}
                                  />
                                </label>
                                <button type="button" className="admin-button admin-button--preview" onClick={handleAddReviewComment}>
                                  Kommentar hinzufügen
                                </button>
                                {reviewComments.length > 0 && (
                                  <ol className="admin-review-comments">
                                    {reviewComments.map((comment, index) => (
                                      <li key={`${comment.startIndex}-${index}`}>
                                        <blockquote>„{comment.selectedText.trim()}“</blockquote>
                                        <p>{comment.feedback}</p>
                                        <button
                                          type="button"
                                          className="admin-button admin-button--danger"
                                          onClick={() => setReviewComments((comments) => comments.filter((_, commentIndex) => commentIndex !== index))}
                                        >
                                          Entfernen
                                        </button>
                                      </li>
                                    ))}
                                  </ol>
                                )}
                              </>
                            )}
                            {reviewError && (
                              <p id={`review-error-${page.id}`} className="admin-review-form__error" role="alert">
                                {reviewError}
                              </p>
                            )}
                            <div className="admin-form__actions">
                              <button type="submit" className="admin-button admin-button--primary" disabled={reviewSubmitting}>
                                {reviewSubmitting ? 'Wird gesendet …' : reviewAction === 'reject' ? 'Ablehnung senden' : 'Korrektur zurücksenden'}
                              </button>
                              <button type="button" className="admin-button admin-button--preview" onClick={() => {
                                setReviewPageId(null);
                                setReviewError('');
                              }} disabled={reviewSubmitting}>
                                Abbrechen
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>}

      <MediaLibrary
        isOpen={mediaLibraryOpen}
        canDelete={isAdmin || isEditor}
        onClose={() => setMediaLibraryOpen(false)}
        onSelect={handleInsertMedia}
      />

      {isAdmin && (
        <section className="admin-card admin-users" aria-labelledby="users-title">
          <div className="admin-card__header">
            <h2 id="users-title" className="admin-card__title">Benutzerverwaltung</h2>
            <p className="admin-card__description">Lege Konten an und verwalte deren Rollen.</p>
          </div>

          <form onSubmit={handleCreateUser} className="admin-user-form">
            <div className="admin-form__field">
              <label htmlFor="new-username">Benutzername</label>
              <input id="new-username" value={newUser.username} onChange={(event) => setNewUser({ ...newUser, username: event.target.value })} maxLength={50} required />
            </div>
            <div className="admin-form__field">
              <label htmlFor="new-email">E-Mail-Adresse</label>
              <input id="new-email" type="email" value={newUser.email} onChange={(event) => setNewUser({ ...newUser, email: event.target.value })} maxLength={100} required />
            </div>
            <div className="admin-form__field">
              <label htmlFor="new-password">Passwort</label>
              <input id="new-password" type="password" value={newUser.password} onChange={(event) => setNewUser({ ...newUser, password: event.target.value })} minLength={8} maxLength={72} required />
            </div>
            <div className="admin-form__field">
              <label htmlFor="new-role">Rolle</label>
              <select id="new-role" value={newUser.role} onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}>
                <option value="ROLE_EMPLOYEE">Mitarbeiter</option>
                <option value="ROLE_EDITOR">Editor</option>
                <option value="ROLE_ADMIN">Administrator</option>
                <option value="ROLE_READER">Leser</option>
              </select>
            </div>
            <button type="submit" className="admin-button admin-button--primary" disabled={creatingUser}>
              {creatingUser ? 'Benutzer wird angelegt …' : 'Benutzer anlegen'}
            </button>
          </form>

          {usersLoading ? (
            <p className="admin-dashboard__empty">Benutzer werden geladen …</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col">Benutzername</th>
                    <th scope="col">E-Mail</th>
                    <th scope="col">Rolle</th>
                    <th scope="col"><span className="sr-only">Aktionen</span></th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((managedUser) => {
                    const isCurrentUser = managedUser.username === user.username;
                    return (
                      <React.Fragment key={managedUser.id}>
                        <tr>
                          <td className="admin-table__title">{managedUser.username}</td>
                          <td>{managedUser.email}</td>
                          <td>{roleLabel(managedUser.role)}</td>
                          <td className="admin-table__actions">
                            <div className="admin-table__action-group">
                              <button
                                type="button"
                                className="admin-button admin-button--preview"
                                onClick={() => handleEditUser(managedUser)}
                                disabled={savingUserId !== null || deletingUserId !== null}
                              >
                                Bearbeiten
                              </button>
                              <button
                                type="button"
                                className="admin-button admin-button--danger"
                                onClick={() => handleDeleteUser(managedUser)}
                                disabled={isCurrentUser || savingUserId !== null || deletingUserId !== null}
                                title={isCurrentUser ? 'Das eigene Konto kann nicht gelöscht werden.' : undefined}
                              >
                                {deletingUserId === managedUser.id ? 'Wird gelöscht …' : 'Löschen'}
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editingUser?.id === managedUser.id && (
                          <tr className="admin-user-edit-row">
                            <td colSpan={4}>
                              <form className="admin-user-edit-form" onSubmit={handleSaveUser}>
                                <div className="admin-form__field">
                                  <label htmlFor={`edit-username-${managedUser.id}`}>Benutzername</label>
                                  <input
                                    id={`edit-username-${managedUser.id}`}
                                    value={editingUser.username}
                                    onChange={(event) => setEditingUser({ ...editingUser, username: event.target.value })}
                                    maxLength={50}
                                    disabled={isCurrentUser}
                                    required
                                  />
                                </div>
                                <div className="admin-form__field">
                                  <label htmlFor={`edit-email-${managedUser.id}`}>E-Mail-Adresse</label>
                                  <input
                                    id={`edit-email-${managedUser.id}`}
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(event) => setEditingUser({ ...editingUser, email: event.target.value })}
                                    maxLength={100}
                                    required
                                  />
                                </div>
                                <div className="admin-form__field">
                                  <label htmlFor={`edit-role-${managedUser.id}`}>Rolle</label>
                                  <select
                                    id={`edit-role-${managedUser.id}`}
                                    value={editingUser.role}
                                    onChange={(event) => setEditingUser({ ...editingUser, role: event.target.value })}
                                  >
                                    <option value="ROLE_EMPLOYEE">Mitarbeiter</option>
                                    <option value="ROLE_EDITOR">Editor</option>
                                    <option value="ROLE_ADMIN">Administrator</option>
                                    <option value="ROLE_READER">Leser</option>
                                  </select>
                                </div>
                                <div className="admin-user-edit-form__actions">
                                  <button
                                    type="submit"
                                    className="admin-button admin-button--primary"
                                    disabled={savingUserId === managedUser.id}
                                  >
                                    {savingUserId === managedUser.id ? 'Wird gespeichert …' : 'Speichern'}
                                  </button>
                                  <button
                                    type="button"
                                    className="admin-button admin-button--secondary"
                                    onClick={() => setEditingUser(null)}
                                    disabled={savingUserId === managedUser.id}
                                  >
                                    Abbrechen
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default AdminDashboard;
