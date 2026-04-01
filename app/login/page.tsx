'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { KeyRound, User, ArrowRight, Construction, Loader2, AlertCircle } from 'lucide-react';
import { gql } from '@apollo/client';
import { useMutation } from '@apollo/client/react';

const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      success
      message
      token {
        access
        refresh
      }
    }
  }
`;

interface LoginResult {
  login: {
    success: boolean;
    message: string;
    token: {
      access: string;
      refresh: string;
    } | null;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [login, { loading }] = useMutation<LoginResult>(LOGIN_MUTATION, {
    onCompleted: (data) => {
      console.log('--- Mutation onCompleted ---', data);
      if (data && data.login.success && data.login.token) {
        localStorage.setItem('access_token', data.login.token.access);
        localStorage.setItem('refresh_token', data.login.token.refresh);
        console.log('Login success, redirecting...');
        router.push('/dashboard');
      } else if (data) {
        setErrorMsg(data.login.message);
      }
    },
    onError: (error) => {
      console.error('--- Mutation onError ---', error);
      setErrorMsg('Error de conexión con el servidor.');
    }
  });

  const handleLogin = async (e: React.FormEvent) => {
    console.log('!!! handleLogin TRIGGERED !!!');
    e.preventDefault();
    console.log('Username:', username, 'Password length:', password.length);
    setErrorMsg('');
    
    try {
      console.log('Executing login mutation...');
      const result = await login({
        variables: { username, password }
      });
      console.log('Mutation promise resolved:', result);
    } catch (err) {
      console.error('Mutation promise exception:', err);
      setErrorMsg('Error de red o servidor.');
    }
  };

  console.log('LoginPage Component Rendered. Loading state:', loading);

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/modern_hardware_store_bg.png" 
          alt="Hardware Store Background"
          fill
          className="object-cover opacity-40 scale-105"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
      </div>

      <div className="container relative z-10 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
          
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-600/20 mb-6 rotate-3">
              <Construction className="text-white h-10 w-10" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Ferretería <span className="text-orange-500">Bradley</span>
            </h1>
            <p className="mt-4 text-zinc-400 text-lg">
              Plataforma de Gestión Profesional
            </p>
          </div>

          <div className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group transition-all duration-500 hover:border-orange-500/30">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-600/10 rounded-full blur-3xl group-hover:bg-orange-600/20 transition-colors" />
            
            <form className="space-y-6" onSubmit={handleLogin}>
              {errorMsg && (
                <div className="flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 animate-in fade-in zoom-in duration-300">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm font-medium">{errorMsg}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2 ml-1">Nombre de Usuario</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input 
                    type="text" 
                    required 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej: admin"
                    disabled={loading}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2 ml-1">
                  <label className="block text-sm font-medium text-zinc-300">Contraseña</label>
                  <a href="#" className="text-xs font-semibold text-orange-500 hover:text-orange-400 transition-colors">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full bg-zinc-800/50 border border-zinc-700 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500 transition-all placeholder:text-zinc-600 disabled:opacity-50"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-orange-600/20 flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    Ingresar al Sistema
                    <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-zinc-500 text-sm">
            © {new Date().getFullYear()} Ferretería Bradley - Todos los derechos reservados
          </p>
        </div>
      </div>
    </div>
  );
}
