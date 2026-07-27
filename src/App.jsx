import React, { useState } from 'react';
import CovertHomePage from './components/CovertHomePage';
import TransitionOverlay from './components/TransitionOverlay';
import SecComPortal from './components/SecComPortal';

export default function App() {
  // App Mode State: 'covert' (Editorial Cover Page) | 'transitioning' (Cipher Matrix) | 'unlocked' (SecCom Secret Vault)
  const [appState, setAppState] = useState('covert');

  // Trigger secret transition when the mole on the woman's face is clicked
  const handleUnlockSecret = () => {
    setAppState('transitioning');
  };

  // Transition overlay finishes
  const handleTransitionComplete = () => {
    setAppState('unlocked');
  };

  // Panic button or Camouflage switch back to innocent cover
  const handleEmergencyPurge = () => {
    setAppState('covert');
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 font-sans">
      {appState === 'covert' && (
        <CovertHomePage onUnlockPortal={handleUnlockSecret} />
      )}

      {appState === 'transitioning' && (
        <TransitionOverlay onComplete={handleTransitionComplete} />
      )}

      {appState === 'unlocked' && (
        <SecComPortal onEmergencyPurge={handleEmergencyPurge} />
      )}
    </div>
  );
}
