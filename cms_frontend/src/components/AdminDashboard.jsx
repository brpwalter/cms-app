import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { pageApi, userApi } from '../api';
import { useAuth } from '../context/AuthContext';
import './AdminDashboard.css';

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    const newPage = { title, slug, content, published: !isEmployee && isPublished };

    try {
      await pageApi.create(newPage);
      setMessage(isEmployee
        ? 'Beitrag wurde zur Freigabe an den Editor übermittelt.'
        : isPublished ? 'Beitrag veröffentlicht.' : 'Beitrag als Entwurf gespeichert.');
      setTitle('');
      setSlug('');
      setContent('');
      setIsPublished(false);
      await loadPages();
    } catch (submitError) {
      setError('Seite konnte nicht erstellt werden. Der Slug ist möglicherweise bereits vergeben.');
      console.error('Fehler beim Erstellen der Seite:', submitError);
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
            <h2 id="create-page-title" className="admin-card__title">Neuen Beitrag schreiben</h2>
            <p className="admin-card__description">
              {isEmployee ? 'Der Beitrag wird nach dem Speichern dem Editor zur Freigabe vorgelegt.' : 'Erstelle einen Beitrag oder veröffentliche ihn direkt.'}
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
              <label htmlFor="page-content">Inhalt</label>
              <div className="admin-form__editor">
                <ReactQuill theme="snow" value={content} onChange={setContent} />
              </div>
            </div>
            {!isEmployee && (
              <label className="admin-form__checkbox">
                <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} />
                <span>Sofort veröffentlichen</span>
              </label>
            )}
            <button type="submit" className="admin-button admin-button--primary">
              {isEmployee ? 'Freigabe beantragen' : 'Beitrag speichern'}
            </button>
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
            <span className="admin-dashboard__count">
              {isEditor ? `${pendingPages.length} offen` : pages.length}
            </span>
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
                    <th scope="col"><span className="sr-only">Aktionen</span></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedPages.map((page) => (
                    <tr key={page.id}>
                      <td className="admin-table__title">{page.title}</td>
                      <td>{page.authorUsername || '—'}</td>
                      <td>
                        <span className={`admin-status ${page.published ? 'admin-status--published' : page.approvalStatus === 'PENDING_APPROVAL' ? 'admin-status--pending' : 'admin-status--draft'}`}>
                          {statusLabel(page)}
                        </span>
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
                            <button type="button" className="admin-button admin-button--primary" onClick={() => handleApprove(page.id)}>
                              Freigeben
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>}

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
