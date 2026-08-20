'use client';

import { calcPercent } from '@/lib/utils';
import { clsx } from '@/lib/utils';

interface PollOptionProps {
  id: string;
  text: string;
  voteCount: number;
  totalVotes: number;
  selected: boolean;
  isVoted: boolean;
  isWinning: boolean;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function PollOption({
  id,
  text,
  voteCount,
  totalVotes,
  selected,
  isVoted,
  isWinning,
  onSelect,
  disabled,
}: PollOptionProps) {
  const percent = calcPercent(voteCount, totalVotes);

  if (isVoted) {
    return (
      <div
        className={clsx(
          'relative rounded-xl overflow-hidden border transition-all duration-200',
          selected
            ? 'border-primary-500 bg-primary-50'
            : isWinning
            ? 'border-gray-300 bg-gray-50'
            : 'border-gray-200 bg-gray-50'
        )}
      >
        {/* Progress bar */}
        <div
          className={clsx(
            'absolute inset-y-0 left-0 transition-all duration-700 ease-out',
            selected ? 'bg-primary-100' : 'bg-gray-100'
          )}
          style={{ width: `${percent}%` }}
          aria-hidden="true"
        />
        <div className="relative flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-2 min-w-0">
            {selected && (
              <span className="flex-shrink-0 w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center">
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none" aria-hidden="true">
                  <path
                    d="M1 3l2 2 4-4"
                    stroke="white"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            )}
            <span
              className={clsx(
                'text-sm font-medium truncate',
                selected ? 'text-primary-800' : 'text-gray-700'
              )}
            >
              {text}
            </span>
            {isWinning && !selected && (
              <span className="flex-shrink-0 text-xs text-gray-400 ml-1">🏆</span>
            )}
          </div>
          <span
            className={clsx(
              'text-sm font-bold ml-3 flex-shrink-0',
              selected ? 'text-primary-700' : 'text-gray-500'
            )}
          >
            {percent}%
          </span>
        </div>
      </div>
    );
  }

  // Pre-vote selectable option
  return (
    <button
      type="button"
      onClick={() => !disabled && onSelect(id)}
      disabled={disabled}
      aria-pressed={selected}
      className={clsx(
        'w-full text-left rounded-xl border px-4 py-3.5 transition-all duration-150',
        'flex items-center gap-3',
        selected
          ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-400'
          : 'border-gray-200 bg-gray-50 hover:border-primary-300 hover:bg-primary-50/40',
        disabled && 'cursor-not-allowed opacity-60'
      )}
    >
      <span
        className={clsx(
          'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors',
          selected ? 'border-primary-600 bg-primary-600' : 'border-gray-300 bg-white'
        )}
        aria-hidden="true"
      >
        {selected && <span className="w-2 h-2 rounded-full bg-white" />}
      </span>
      <span className={clsx('text-sm font-medium', selected ? 'text-primary-800' : 'text-gray-700')}>
        {text}
      </span>
    </button>
  );
}
