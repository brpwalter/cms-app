import { useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AuthenticatedLayout.css';

const roleLabels = {
  ROLE_ADMIN: 'Administrator',
  ROLE_EDITOR: 'Editor',
  ROLE_EMPLOYEE: 'Mitarbeiter',
  ROLE_READER: 'Leser',
};

function AuthenticatedLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const roleLabel = user?.roles?.map((role) => roleLabels[role] || role).join(', ');

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
      {user && (
        <header className="authenticated-header">
          <span className="authenticated-header__brand">CMS</span>
          <div className="authenticated-header__account">
            <span className="authenticated-header__identity">
              {user.username}{roleLabel ? ` · ${roleLabel}` : ''}
            </span>
            <button type="button" className="authenticated-header__logout" onClick={handleLogout}>
              Abmelden
            </button>
          </div>
        </header>
      )}
      <Outlet />
    </>
  );
}

export default AuthenticatedLayout;
