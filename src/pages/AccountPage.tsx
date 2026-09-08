import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { useAuth } from '@/store/AuthContext';
import { useRecipes } from '@/store/RecipesContext';
import { useCloudSync } from '@/store/CloudSync';
import { countPlannedMeals } from '@/domain/planner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';

type Mode = 'entrar' | 'crear' | 'recuperar';

const SYNC_LABELS = {
  local: 'Guardado en este dispositivo',
  cargando: 'Cargando tu cuenta…',
  sincronizado: 'Sincronizado con tu cuenta',
  guardando: 'Guardando cambios…',
  error: 'Error de sincronización',
} as const;

export function AccountPage() {
  useDocumentTitle('Mi cuenta');
  const { cloudEnabled, user, loading, signIn, signUp, signOut, resetPassword, updateName } = useAuth();
  const { favorites, pantry, shopping, plan, notify } = useApp();
  const { mine } = useRecipes();
  const syncStatus = useCloudSync();

  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ kind: 'error' | 'ok'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editingName, setEditingName] = useState('');

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setBusy(true);
    try {
      if (mode === 'entrar') {
        const r = await signIn(email.trim(), password);
        if (r.user) notify(`Hola, ${r.user.name}`);
      } else if (mode === 'crear') {
        if (password.length < 8) throw new Error('La contraseña debe tener al menos 8 caracteres.');
        const r = await signUp(email.trim(), password, name.trim() || email.split('@')[0]);
        if (r.message) setMessage({ kind: 'ok', text: r.message });
        else if (r.user) notify(`Bienvenido, ${r.user.name}`);
      } else {
        await resetPassword(email.trim());
        setMessage({ kind: 'ok', text: 'Si el correo existe, te enviamos un enlace para cambiar la contraseña.' });
      }
    } catch (err) {
      setMessage({ kind: 'error', text: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const stats = [
    { label: 'Favoritos', value: favorites.length, to: '/favoritos' },
    { label: 'En la despensa', value: pantry.length, to: '/despensa' },
    { label: 'Por comprar', value: shopping.filter((i) => !i.checked).length, to: '/lista-de-compras' },
    { label: 'Comidas planeadas', value: countPlannedMeals(plan), to: '/planificador' },
    { label: 'Mis recetas', value: mine.length, to: '/mis-recetas' },
  ];

  const statsBlock = (
    <section className="panel" aria-labelledby="mi-espacio">
      <h2 id="mi-espacio" className="panel__title">
        Mi espacio
      </h2>
      <div className="stats stats--compact">
        {stats.map((s) => (
          <Link key={s.label} to={s.to} className="stat stat--link">
            <span className="stat__value">{s.value}</span>
            <span className="stat__label">{s.label}</span>
          </Link>
        ))}
      </div>
      <p className="muted sync-line" data-testid="sync-status">
        <Icon name={syncStatus === 'local' ? 'cloud-off' : 'cloud'} /> {SYNC_LABELS[syncStatus]}
      </p>
    </section>
  );

  if (!cloudEnabled) {
    return (
      <div>
        <div className="page-head">
          <span className="eyebrow">Cuenta</span>
          <h1>Mi espacio</h1>
          <p>Esta instalación funciona en modo local: favoritos, despensa, lista, plan y tus recetas se guardan en este navegador.</p>
        </div>
        <div className="account">
          {statsBlock}
          <section className="panel">
            <h2 className="panel__title">Activar cuentas y sincronización</h2>
            <p className="muted">
              Para que las personas se registren y sus datos viajen entre dispositivos, conecta un proyecto de Supabase: crea las tablas con
              <code> supabase/migrations/0001_cuentas_y_recetas.sql</code> y define <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>. El README explica el paso a paso.
            </p>
          </section>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="page-head">
        <h1>Mi cuenta</h1>
        <p className="muted">Cargando…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div>
        <div className="page-head">
          <span className="eyebrow">Cuenta</span>
          <h1>Hola, {user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="account">
          {statsBlock}
          <section className="panel" aria-labelledby="perfil">
            <h2 id="perfil" className="panel__title">
              Perfil
            </h2>
            <form
              className="tag-input"
              onSubmit={async (e) => {
                e.preventDefault();
                if (!editingName.trim()) return;
                try {
                  await updateName(editingName.trim());
                  setEditingName('');
                  notify('Nombre actualizado');
                } catch (err) {
                  notify((err as Error).message);
                }
              }}
            >
              <input className="input" value={editingName} placeholder={user.name} onChange={(e) => setEditingName(e.target.value)} aria-label="Nombre para mostrar" maxLength={60} />
              <Button type="submit" variant="secondary" icon="save" disabled={!editingName.trim()}>
                Guardar
              </Button>
            </form>
            <p className="muted">Tu nombre aparece en las recetas que publiques en la comunidad.</p>
            <div className="planner__actions">
              <Button to="/mis-recetas" variant="primary" icon="chef-hat">
                Mis recetas
              </Button>
              <Button
                variant="secondary"
                icon="log-out"
                onClick={() =>
                  signOut().then(() => {
                    setMode('entrar');
                    setPassword('');
                    setMessage(null);
                    notify('Sesión cerrada');
                  })
                }
                data-testid="sign-out"
              >
                Cerrar sesión
              </Button>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <span className="eyebrow">Cuenta</span>
        <h1>{mode === 'crear' ? 'Crear cuenta' : mode === 'recuperar' ? 'Recuperar contraseña' : 'Entrar'}</h1>
        <p>Con una cuenta, tus favoritos, despensa, lista de mercado, plan y recetas te siguen a cualquier dispositivo. Y puedes publicar recetas en la comunidad.</p>
      </div>
      <div className="account">
        <section className="panel auth" aria-label="Acceso">
          <div className="segmented" role="group" aria-label="Modo">
            <button type="button" className={['segmented__btn', mode === 'entrar' ? 'is-active' : ''].join(' ')} onClick={() => setMode('entrar')} aria-pressed={mode === 'entrar'}>
              Entrar
            </button>
            <button type="button" className={['segmented__btn', mode === 'crear' ? 'is-active' : ''].join(' ')} onClick={() => setMode('crear')} aria-pressed={mode === 'crear'} data-testid="mode-signup">
              Crear cuenta
            </button>
          </div>
          <form className="auth__form" onSubmit={submit}>
            {mode === 'crear' ? (
              <label className="field">
                <span className="field__label">Tu nombre</span>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" maxLength={60} placeholder="ej. Juan" data-testid="auth-name" />
              </label>
            ) : null}
            <label className="field">
              <span className="field__label">Correo</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" inputMode="email" required placeholder="tu@correo.com" data-testid="auth-email" />
            </label>
            {mode !== 'recuperar' ? (
              <label className="field">
                <span className="field__label">Contraseña {mode === 'crear' ? '(mínimo 8 caracteres)' : ''}</span>
                <div className="input-with-action">
                  <input className="input" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'crear' ? 'new-password' : 'current-password'} required minLength={mode === 'crear' ? 8 : undefined} data-testid="auth-password" />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setShowPassword((s) => !s)}>
                    {showPassword ? 'Ocultar' : 'Ver'}
                  </Button>
                </div>
              </label>
            ) : null}
            {message ? (
              <p className={['auth__message', message.kind === 'error' ? 'is-error' : 'is-ok'].join(' ')} role={message.kind === 'error' ? 'alert' : 'status'} data-testid="auth-message">
                {message.text}
              </p>
            ) : null}
            <Button type="submit" variant="primary" icon={mode === 'crear' ? 'user' : mode === 'recuperar' ? 'mail' : 'log-in'} block disabled={busy} data-testid="auth-submit">
              {mode === 'crear' ? 'Crear cuenta' : mode === 'recuperar' ? 'Enviar enlace' : 'Entrar'}
            </Button>
          </form>
          {mode === 'entrar' ? (
            <button type="button" className="auth__link" onClick={() => setMode('recuperar')}>
              ¿Olvidaste tu contraseña?
            </button>
          ) : (
            <button type="button" className="auth__link" onClick={() => setMode('entrar')}>
              Ya tengo cuenta
            </button>
          )}
        </section>
        {statsBlock}
      </div>
    </div>
  );
}
