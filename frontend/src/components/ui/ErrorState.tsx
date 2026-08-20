interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center gap-4">
      <div className="text-4xl">😕</div>
      <div>
        <h3 className="text-lg font-semibold text-gray-800">Oops!</h3>
        <p className="mt-1 text-sm text-gray-400">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-sm text-primary-600 font-medium hover:underline"
        >
          Try again
        </button>
      )}
    </div>
  );
}
