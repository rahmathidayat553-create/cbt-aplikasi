import React, { useState, useEffect } from 'react';
import { IconClock } from './icons/Icons';

interface TimerProps {
  endTime: number;
  onTimeUp: () => void;
}

const Timer: React.FC<TimerProps> = ({ endTime, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(() => {
      const remaining = Math.round((endTime - Date.now()) / 1000);
      return Math.max(0, remaining);
  });

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const intervalId = setInterval(() => {
      setTimeLeft(prevTime => Math.max(0, prevTime - 1));
    }, 1000);

    return () => clearInterval(intervalId);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isWarning = timeLeft < 5 * 60; // 5 minutes warning

  return (
    <div className={`flex items-center space-x-2 font-mono text-lg font-bold p-2 px-4 rounded-lg transition-colors duration-300 ${isWarning ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200'}`}>
      <IconClock className="h-5 w-5" />
      <span>
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default Timer;