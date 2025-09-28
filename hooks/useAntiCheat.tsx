import { useEffect } from 'react';

interface AntiCheatCallbacks {
  onTabSwitch: () => void;
  onFullscreenEnter: () => void;
  onFullscreenExit: () => void;
  enabled: boolean;
}

export const useAntiCheat = ({ onTabSwitch, onFullscreenEnter, onFullscreenExit, enabled }: AntiCheatCallbacks) => {
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
        onTabSwitch();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const handleFullscreenChange = () => {
        if (document.fullscreenElement) {
            onFullscreenEnter();
        } else {
            onFullscreenExit();
        }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);


    return () => {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.error("Could not exit fullscreen:", err));
      }
      document.removeEventListener('copy', preventDefault);
      document.removeEventListener('paste', preventDefault);
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [onTabSwitch, onFullscreenEnter, onFullscreenExit, enabled]);
};