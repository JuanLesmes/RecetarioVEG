import type { UserState } from '@/domain/sync';
import type { UserRecipe } from '@/domain/userRecipe';

/** Usuario autenticado tal como lo ve la interfaz. */
export interface CloudUser {
  id: string;
  email: string;
  name: string;
}

export interface AuthResult {
  user: CloudUser | null;
  /** Mensaje informativo (p. ej. "revisa tu correo para confirmar la cuenta"). */
  message?: string;
}

/**
 * Contrato con el proveedor de nube. La app solo depende de esta interfaz, así que
 * Supabase puede reemplazarse (o simularse en pruebas) sin tocar componentes.
 */
export interface CloudAdapter {
  getSession(): Promise<CloudUser | null>;
  onAuthChange(callback: (user: CloudUser | null) => void): () => void;
  signUp(email: string, password: string, name: string): Promise<AuthResult>;
  signIn(email: string, password: string): Promise<AuthResult>;
  signOut(): Promise<void>;
  resetPassword(email: string): Promise<void>;
  updateName(name: string): Promise<void>;

  loadState(userId: string): Promise<UserState | null>;
  saveState(userId: string, state: UserState): Promise<void>;

  listMyRecipes(userId: string): Promise<UserRecipe[]>;
  listCommunityRecipes(): Promise<UserRecipe[]>;
  saveRecipe(recipe: UserRecipe): Promise<void>;
  deleteRecipe(id: string): Promise<void>;
}

/** Error legible para la interfaz, con el mensaje ya traducido. */
export class CloudError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CloudError';
  }
}

/** Traduce los mensajes más comunes de Supabase Auth al español. */
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.';
  if (m.includes('email not confirmed')) return 'Confirma tu correo antes de entrar: revisa tu bandeja de entrada.';
  if (m.includes('user already registered') || m.includes('already been registered')) return 'Ya existe una cuenta con ese correo.';
  if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 8 caracteres.';
  if (m.includes('unable to validate email') || m.includes('invalid email')) return 'Escribe un correo válido.';
  if (m.includes('rate limit') || m.includes('too many requests')) return 'Demasiados intentos. Espera un momento y vuelve a probar.';
  if (m.includes('network') || m.includes('fetch')) return 'No hay conexión con el servidor. Revisa tu internet.';
  return message;
}
