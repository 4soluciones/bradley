/**
 * Configuración compartida del proyecto.
 * Única fuente de verdad para la URL de la API.
 *
 * En producción: define NEXT_PUBLIC_API_URL en tu plataforma de deploy
 * (Vercel, Railway, variables de entorno del servidor, etc.).
 * No necesitas cambiar código: solo configurar la variable una vez por entorno.
 */
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8006";

/** URL base de la API (sin trailing slash). */
export function getApiBaseUrl(): string {
  return API_BASE_URL.replace(/\/$/, "");
}

/** URI del endpoint GraphQL para Apollo. */
export function getGraphqlUri(): string {
  return `${getApiBaseUrl()}/graphql/`;
}
