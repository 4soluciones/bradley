import { getApiBaseUrl } from "@/app/lib/config";

/**
 * Convierte la URL de imagen del producto a una URL absoluta.
 * La API devuelve rutas relativas como /media/products/xxx.png,
 * pero el frontend corre en otro origen, así que debe apuntar al servidor de la API.
 */
export function getProductImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
  const base = getApiBaseUrl();
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${base}${path}`;
}
