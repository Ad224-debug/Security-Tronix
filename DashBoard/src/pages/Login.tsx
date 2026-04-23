import React from 'react';
import { motion } from 'motion/react';
import { Shield } from 'lucide-react';

export default function Login() {
  return (
    <div className="min-h-screen bg-discord-bg flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-discord-card border border-white/5 rounded-2xl p-10 w-full max-w-md text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-discord-blurple rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
          <span className="text-white font-black text-2xl">ST</span>
        </div>
        <h1 className="text-3xl font-black text-discord-header mb-2">Security Tronix</h1>
        <p className="text-discord-muted mb-8">Iniciá sesión con tu cuenta de Discord para acceder al dashboard de configuración.</p>

        <a
          href="/auth/login"
          className="flex items-center justify-center space-x-3 bg-discord-blurple hover:bg-[#4752C4] text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 w-full"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
          </svg>
          <span>Continuar con Discord</span>
        </a>

        <p className="text-discord-muted text-xs mt-6">Solo se solicitan permisos para ver tu perfil y servidores. No se realizan acciones en tu nombre.</p>
      </motion.div>
    </div>
  );
}
