import { useEffect, useCallback } from 'react';

interface AntiCheatCallbacks {
  onVisibilityHidden: () => void;
  onFullscreenExit: () => void;
  onBrowserUnload: () => void;
  enabled: boolean;
}

export const useAntiCheat = ({ onVisibilityHidden, onFullscreenExit, onBrowserUnload, enabled }: AntiCheatCallbacks) => {
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const preventDefault = (e: Event) => e.preventDefault();
    document.addEventListener('copy', preventDefault);
    document.addEventListener('paste', preventDefault);
    document.addEventListener('contextmenu', preventDefault);

    const handleVisibilityChange = () => {
      if (document.hidden) {
        onVisibilityHidden();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
            onFullscreenExit();
        }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      onBrowserUnload();
      // Standard practice to prevent accidental closing, though not all browsers respect it.
      e.preventDefault();
      e.returnValue = 'Apakah Anda yakin ingin meninggalkan halaman? Progres ujian akan disimpan.';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);


    return () => {
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [onVisibilityHidden, onFullscreenExit, onBrowserUnload, enabled]);
};