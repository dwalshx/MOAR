import { useEffect, useRef, useState } from 'react';

interface NotesEditorProps {
  value?: string;
  onChange: (notes: string) => void;
  placeholder?: string;
}

/**
 * Inline expandable notes field. Collapsed shows a small "Add note" button
 * (or a snippet of existing note). Expanded shows a textarea with
 * debounced save.
 */
export default function NotesEditor({ value = '', onChange, placeholder = 'Add a note...' }: NotesEditorProps) {
  const [open, setOpen] = useState(value.length > 0);
  const [draft, setDraft] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync from prop when it changes externally
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = (text: string) => {
    setDraft(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(text), 500);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-text-secondary text-xs
                   active:text-accent transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
        {value ? 'Edit note' : 'Add note'}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <textarea
        value={draft}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => {
          if (draft === '' && value === '') setOpen(false);
        }}
        placeholder={placeholder}
        autoFocus={value === ''}
        rows={2}
        className="w-full bg-bg-card border border-border rounded-lg px-3 py-2
                   text-text-primary text-sm placeholder-text-secondary
                   outline-none focus:border-accent transition-colors resize-y"
      />
      {draft.length > 0 && (
        <button
          type="button"
          onClick={() => {
            handleChange('');
            setOpen(false);
          }}
          className="text-text-secondary text-xs self-start active:text-red-400"
        >
          Clear note
        </button>
      )}
    </div>
  );
}
