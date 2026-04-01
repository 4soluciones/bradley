'use client';

import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/app/lib/config';

interface ProductDisplayData {
  name: string;
  price: string;
  image: string;
  description?: string;
}

export default function DisplayPage() {
  const [product, setProduct] = useState<ProductDisplayData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const wsUrl = getApiBaseUrl().replace('http', 'ws') + '/ws/sale-display/';
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { type?: string; data?: ProductDisplayData };
        if (message.type === 'show_product' && message.data) {
          setProduct(message.data);
        } else if (message.type === 'clear_display') {
          setProduct(null);
        }
      } catch {
        /* mensaje no JSON o formato desconocido */
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-8 overflow-hidden">
      {!isConnected && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-red-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          Desconectado
        </div>
      )}

      {isConnected && (
        <div className="absolute top-4 right-4 flex items-center gap-2 text-green-500 text-sm">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          En línea
        </div>
      )}

      {product ? (
        <div className="w-full max-w-6xl animate-in fade-in zoom-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Image Container */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative bg-[#0f172a] border border-white/10 rounded-3xl overflow-hidden glass aspect-square flex items-center justify-center">
                {product.image ? (
                  <img
                    src={product.image.startsWith('http') ? product.image : `${getApiBaseUrl()}${product.image}`}
                    alt={product.name}
                    className="w-full h-full object-contain p-8 transform transition-transform duration-700 group-hover:scale-105"
                  />
                ) : (
                  <div className="text-gray-500 italic">Imagen no disponible</div>
                )}
              </div>
            </div>

            {/* Info Container */}
            <div className="flex flex-col gap-8">
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-white">
                {product.name}
              </h1>
              
              {product.description && (
                <p className="text-xl text-gray-400 italic">
                  {product.description}
                </p>
              )}

              <div className="mt-8">
                <div className="text-gray-400 text-2xl mb-2 uppercase tracking-widest font-semibold">Precio Actual</div>
                <div className="flex items-baseline gap-4">
                  <span className="text-orange-500 text-4xl font-bold">S/</span>
                  <span className="text-8xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400">
                    {parseFloat(product.price).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-12 h-1 w-24 bg-orange-600 rounded-full"></div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center animate-pulse">
           <div className="text-6xl font-bold text-gray-800 mb-4 tracking-tighter uppercase">BIENVENIDO</div>
           <div className="text-2xl text-orange-600/50 font-medium tracking-wide">ESPERANDO ARTÍCULO...</div>
        </div>
      )}

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-2 bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600"></div>
    </div>
  );
}
