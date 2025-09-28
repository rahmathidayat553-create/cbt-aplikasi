import React from 'react';
import { Soal, AnswerOption } from '../types';
import { IconFlag } from './icons/Icons';

interface QuestionNavigatorProps {
  questionCount: number;
  currentIndex: number;
  answers: Record<number, AnswerOption | null>;
  questions: Soal[];
  onSelectQuestion: (index: number) => void;
  flaggedQuestions: Set<number>;
}

const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questionCount, currentIndex, answers, questions, onSelectQuestion, flaggedQuestions }) => {
  
  const handleJumpToNextFlagged = () => {
    const flaggedIndices = questions
      .map((q, index) => ({ q, index }))
      .filter(item => flaggedQuestions.has(item.q.id_soal))
      .map(item => item.index);

    if (flaggedIndices.length === 0) return;

    const nextFlaggedIndex = flaggedIndices.find(index => index > currentIndex);
    
    if (nextFlaggedIndex !== undefined) {
      onSelectQuestion(nextFlaggedIndex);
    } else {
      onSelectQuestion(flaggedIndices[0]);
    }
  };

  const flaggedCount = flaggedQuestions.size;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Navigasi Soal</h3>
        {flaggedCount > 0 && (
            <button 
                onClick={handleJumpToNextFlagged}
                className="text-xs flex items-center space-x-1 text-yellow-600 dark:text-yellow-400 hover:underline"
            >
                <IconFlag className="h-3 w-3" />
                <span>Lompat ({flaggedCount})</span>
            </button>
        )}
      </div>
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: questionCount }, (_, i) => {
          const questionId = questions[i]?.id_soal;
          const isAnswered = questionId ? answers[questionId] !== null : false;
          const isFlagged = questionId ? flaggedQuestions.has(questionId) : false;

          let buttonClass = 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-slate-300';
          if (isAnswered) {
            buttonClass = 'bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-700 dark:hover:bg-primary-600';
          }
          if (i === currentIndex) {
            buttonClass = 'bg-primary-500 text-white ring-2 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 ring-primary-500';
          }

          return (
            <button
              key={i}
              onClick={() => onSelectQuestion(i)}
              className={`relative w-12 h-12 flex items-center justify-center rounded-lg font-bold transition-all ${buttonClass}`}
            >
              {i + 1}
              {isFlagged && (
                <IconFlag className="absolute top-1 right-1 h-3 w-3 text-yellow-400 fill-current" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default QuestionNavigator;