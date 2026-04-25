import { useState, useRef, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

interface BarTypeSelectorProps {
  value?: string;
  onChange: (barType: string | undefined) => void;
}

const FIXED_OPTIONS = [
  { id: 'bodyweight', name: 'Bodyweight' },
  { id: 'dumbbell', name: 'Dumbbell' },
  { id: 'cable', name: 'Cable' },
  { id: 'machine', name: 'Machine' },
];

export default function BarTypeSelector({ value, onChange }: BarTypeSelectorProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const bars = settingsService.getBars();
  const allOptions = [
    ...bars.map(b => ({ id: `bar:${b.id}`, name: `${b.name} (${b.weight} lbs)` })),
    ...FIXED_OPTIONS,
  ];

  const current = value ? allOptions.find(o => o.id === value) : null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-text-secondary text-xs
                   active:text-accent transition-colors"
      >
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6.5 6.5h11M6 2v4M18 2v4M6 18v4M18 18v4M2 8h4v8H2zM18 8h4v8h-4zM6 10h12v4H6z" />
        </svg>
        {current ? current.name : 'Set bar type'}
      </button>

      {open && (
        <div className="absolute left-0 bottom-full mb-1 w-56 bg-bg-secondary border border-border
                        rounded-xl shadow-lg z-30 overflow-hidden">
          <button
            onClick={() => { onChange(undefined); setOpen(false); }}
            className={`w-full text-left px-4 py-2.5 text-sm min-h-[40px]
                        active:bg-bg-card transition-colors border-b border-border ${
                          !value ? 'text-accent' : 'text-text-secondary'
                        }`}
          >
            None
          </button>
          {allOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => { onChange(opt.id); setOpen(false); }}
              className={`w-full text-left px-4 py-2.5 text-sm min-h-[40px]
                          active:bg-bg-card transition-colors ${
                            value === opt.id ? 'text-accent' : 'text-text-primary'
                          }`}
            >
              {opt.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
