import React, { useEffect, useState } from 'react';
import { ShieldCheck, Lock, Terminal, Cpu } from 'lucide-react';

export default function TransitionOverlay({ onComplete }) {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const sequence = [
      "INITIALIZING SECCOM PRIVACY KERNEL...",
      "AUTHENTICATING BIOMETRIC BEAUTY MARK HASH...",
      "VERIFYING ZERO-KNOWLEDGE HANDSHAKE...",
      "DERIVING HARDWARE-ACCELERATED AES-256-GCM KEYS...",
      "ESTABLISHING RAM-ONLY TOR ONION CIRCUIT [3 HOPS]...",
      "DISGUISE DISMANTLED // PRIVACY PORTAL UNLOCKED."
    ];

    let logIndex = 0;
    const interval = setInterval(() => {
      if (logIndex < sequence.length) {
        setLogs(prev => [...prev, sequence[logIndex]]);
        setStep(logIndex + 1);
        logIndex++;
      } else {
        clearInterval(interval);
        setTimeout(onComplete, 600);
      }
    }, 320);

    return () => clearInterval(interval);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center font-mono text-cyan-400 p-6 select-none animate-in fade-in duration-300">
      {/* Matrix Scanlines */}
      <div className="absolute inset-0 bg-[radial-gradient(#00f3ff_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none"></div>

      <div className="relative z-10 max-w-md w-full bg-slate-900/90 border border-cyan-500/40 rounded-2xl p-6 shadow-[0_0_50px_rgba(0,243,255,0.2)]">
        {/* Animated Cyber Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 border border-cyan-500/50 text-cyan-400 animate-pulse">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg tracking-wider text-slate-100 flex items-center gap-2">
                SecCom <span className="text-xs px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300">v4.9</span>
              </h3>
              <p className="text-xs text-slate-400">Decryption Protocol Initializing</p>
            </div>
          </div>
          <Lock className="w-5 h-5 text-emerald-400 animate-bounce" />
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-2 mb-6 overflow-hidden border border-cyan-900">
          <div
            className="bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-300 h-full transition-all duration-300 shadow-[0_0_12px_#00ff9d]"
            style={{ width: `${(step / 6) * 100}%` }}
          ></div>
        </div>

        {/* Realtime Terminal Console Output */}
        <div className="bg-slate-950/80 rounded-xl p-4 border border-cyan-500/20 text-xs space-y-2 h-44 overflow-y-auto font-mono text-cyan-300/90 shadow-inner">
          <div className="flex items-center gap-2 text-slate-500 pb-1 border-b border-slate-800">
            <Terminal className="w-3.5 h-3.5" />
            <span>sys_log://decryption_gate</span>
          </div>
          {logs.map((log, index) => (
            <div key={index} className="flex items-start gap-2 animate-in fade-in slide-in-from-left-2 duration-200">
              <span className="text-emerald-400 font-bold">&gt;</span>
              <span className={index === logs.length - 1 ? "text-cyan-200 font-semibold" : "text-cyan-400/70"}>
                {log}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-slate-800 text-center text-[10px] text-slate-400 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>RAM-Only Execution • Zero Metadata Saved</span>
        </div>
      </div>
    </div>
  );
}
