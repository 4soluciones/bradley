'use client';

import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '@/app/lib/config';

interface ProductDisplayData {
  name: string;
  price: string;
  image: string;
  quantity?: number | string;
  total?: string;
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
    <div className="min-h-screen bg-[#020617] text-white flex flex-col items-center justify-center p-6 md:p-12 overflow-hidden relative">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[500px] bg-orange-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      {!isConnected && (
        <div className="absolute top-6 right-6 flex items-center gap-3 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 text-red-400 font-medium tracking-wide shadow-lg backdrop-blur-md z-50">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
          Desconectado
        </div>
      )}

      {isConnected && (
        <div className="absolute top-6 right-6 flex items-center gap-3 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/20 text-green-400 font-medium tracking-wide shadow-lg backdrop-blur-md z-50">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
          En línea
        </div>
      )}

      {product ? (
        <div className="w-full max-w-[95vw] lg:max-w-7xl animate-in fade-in zoom-in duration-500 flex flex-col gap-6 md:gap-10 relative z-10">
          {/* Header Container for Name to give it more space */}
          <div className="w-full bg-[#0f172a]/90 border border-white/10 rounded-[2rem] p-8 md:p-10 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-tight tracking-tight text-white uppercase text-center md:text-left drop-shadow-xl relative z-10">
              {product.name}
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 items-stretch">
            {/* Image Container */}
            <div className="lg:col-span-5 relative group flex">
              <div className="absolute -inset-1 bg-gradient-to-br from-orange-600 to-orange-400 rounded-[2rem] blur-md opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-[#0f172a]/80 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl w-full flex items-center justify-center p-8 shadow-2xl">
                {product.image ? (
                  <img
                    src={product.image.startsWith('http') ? product.image : `${getApiBaseUrl()}${product.image}`}
                    alt={product.name}
                    className="w-full h-[300px] md:h-[400px] object-contain transform transition-transform duration-700 group-hover:scale-105 drop-shadow-2xl"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-4 text-gray-500 opacity-60">
                    <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-2xl font-medium tracking-wider">SIN IMAGEN</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Container */}
            <div className="lg:col-span-7 flex flex-col justify-center gap-8 md:gap-12 bg-[#0f172a]/90 border border-white/10 rounded-[2rem] p-8 md:p-14 shadow-2xl relative overflow-hidden backdrop-blur-xl">
               {/* Accent background elements */}
               <div className="absolute -top-32 -right-32 w-80 h-80 bg-orange-600/10 rounded-full blur-3xl pointer-events-none"></div>
               <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

              <div className="grid grid-cols-2 gap-8 w-full z-10">
                <div className="flex flex-col gap-3">
                  <div className="text-gray-400 text-lg md:text-xl uppercase tracking-widest font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    Cantidad
                  </div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl md:text-6xl font-black text-white tracking-tight">
                      {product.quantity || 1}
                    </span>
                    <span className="text-gray-500 text-xl md:text-2xl font-bold uppercase tracking-widest">
                      unid.
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="text-gray-400 text-lg md:text-xl uppercase tracking-widest font-bold flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gray-500"></div>
                    Precio Unit.
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-500 text-2xl md:text-3xl font-bold mt-1">S/</span>
                    <span className="text-4xl md:text-6xl font-black text-white tracking-tight">
                      {parseFloat(product.price).toFixed(4)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-white/20 via-white/10 to-transparent z-10 my-2"></div>

              <div className="z-10 flex flex-col gap-4">
                <div className="text-orange-500 text-2xl md:text-3xl uppercase tracking-widest font-black flex items-center gap-6">
                  Total
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-orange-500/50 to-transparent"></div>
                </div>
                <div className="flex items-start gap-4 bg-black/20 p-6 md:p-8 rounded-3xl border border-white/5">
                  <span className="text-orange-500 text-5xl md:text-7xl font-black mt-2 drop-shadow-lg">S/</span>
                  <span className="text-7xl md:text-[8rem] leading-none font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-gray-400 drop-shadow-2xl tracking-tighter">
                    {product.total ? parseFloat(product.total).toFixed(2) : (parseFloat(product.price) * (Number(product.quantity) || 1)).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center relative z-10 flex flex-col items-center justify-center bg-[#0f172a]/50 p-16 rounded-[3rem] border border-white/5 backdrop-blur-md shadow-2xl">
           <div className="w-24 h-24 mb-8 rounded-full bg-orange-600/20 flex items-center justify-center animate-pulse">
             <div className="w-16 h-16 rounded-full bg-orange-600/40 flex items-center justify-center">
               <div className="w-8 h-8 rounded-full bg-orange-500"></div>
             </div>
           </div>
           <div className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tighter uppercase drop-shadow-lg">BIENVENIDO A BRADLEY</div>
           <div className="text-xl md:text-3xl text-orange-400/80 font-bold tracking-widest uppercase flex items-center gap-4">
             <span className="w-12 h-px bg-orange-400/50"></span>
             Caja Disponible
             <span className="w-12 h-px bg-orange-400/50"></span>
           </div>
        </div>
      )}

      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-3 bg-gradient-to-r from-orange-700 via-orange-500 to-orange-700 shadow-[0_-10px_30px_rgba(234,88,12,0.3)] z-50"></div>
    </div>
  );
}
