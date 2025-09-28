import { useEffect } from 'react';

export const useAntiCheat = () => {
  useEffect(() => {
    // Attempt to enter fullscreen
    const enterFullscreen = () => {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    };
    enterFullscreen();

    // Disable copy, paste, and context menu
    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('contextmenu', preventDefault);

    // Handle visibility change (tab switching)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        alert('Peringatan: Anda telah beralih dari tab ujian. Aktivitas ini dapat dicatat.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Cleanup function
    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
};
