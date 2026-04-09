import { useState, useEffect, useRef, useMemo } from 'react';
import { workoutService } from '../../services/workoutService';

interface ExerciseInputProps {
  onAddExercise: (name: string) => void;
}

export default function ExerciseInput({ onAddExercise }: ExerciseInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [exerciseNames, setExerciseNames] = useState<string[]>([]);
  const [debouncedValue, setDebouncedValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const blurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load exercise names on mount
  useEffect(() => {
    workoutService.getExerciseNames().then(setExerciseNames);
  }, []);

  // Debounce the search input by 150ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, 150);
    return () => clearTimeout(timer);
  }, [inputValue]);

  // Filter matches
  const suggestions = useMemo(() => {
    if (!debouncedValue.trim()) return [];
    const lower = debouncedValue.toLowerCase();
    return exerciseNames.filter((name) =>
      name.toLowerCase().includes(lower)
    );
  }, [debouncedValue, exerciseNames]);

  const showDropdown = isFocused && inputValue.trim().length > 0 && suggestions.length > 0;

  const handleSelect = (name: string) => {
    onAddExercise(name);
    setInputValue('');
    setDebouncedValue('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (trimmed) {
      onAddExercise(trimmed);
      setInputValue('');
      setDebouncedValue('');
    }
  };

  const handleFocus = () => {
    if (blurTimeoutRef.current) {
      clearTimeout(blurTimeoutRef.current);
      blurTimeoutRef.current = null;
    }
    setIsFocused(true);
  };

  const handleBlur = () => {
    // Delay blur so tap on suggestion registers
    blurTimeoutRef.current = setTimeout(() => {
      setIsFocused(false);
    }, 200);
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="Add exercise..."
        className="bg-bg-card border border-border rounded-lg px-4 py-3
                   text-text-primary placeholder-text-secondary w-full min-h-[44px]
                   outline-none focus:border-accent transition-colors"
      />

      {showDropdown && (
        <div className="absolute z-10 w-full bg-bg-secondary border border-border
                        rounded-lg mt-1 max-h-48 overflow-y-auto">
          {suggestions.map((name) => (
            <button
              key={name}
              type="button"
              className="block w-full text-left px-4 py-3 min-h-[44px]
                         text-text-primary hover:bg-bg-card cursor-pointer
                         transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(name)}
            >
              {name}
            </button>
          ))}
        </div>
      )}
    </form>
  );
}
