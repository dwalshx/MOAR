import { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';

export default function BodyWeightSetting() {
  const [isOpen, setIsOpen] = useState(false);
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const bw = settingsService.getBodyWeight();
    if (bw) setValue(bw.toString());
  }, []);

  const handleSave = () => {
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      settingsService.setBodyWeight(parsed);
      setSaved(true);
      setTimeout(() => {
        setSaved(false);
        setIsOpen(false);
      }, 1200);
    }
  };

  const currentBw = settingsService.getBodyWeight();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 text-text-secondary text-xs active:text-accent transition-colors mt-3"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
        </svg>
        {currentBw ? `Body weight: ${currentBw} lbs` : 'Set body weight'}
      </button>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <label className="text-text-secondary text-xs">Body weight:</label>
      <input
        type="number"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="185"
        className="bg-bg-card border border-border rounded-lg px-3 py-1.5 w-20
                   text-text-primary text-sm text-center outline-none focus:border-accent"
        autoFocus
      />
      <span className="text-text-secondary text-xs">lbs</span>
      <button
        onClick={handleSave}
        className="text-accent text-sm font-semibold min-h-[32px] px-2 active:opacity-80"
      >
        {saved ? 'Saved!' : 'Save'}
      </button>
      <button
        onClick={() => setIsOpen(false)}
        className="text-text-secondary text-xs min-h-[32px] px-1 active:opacity-80"
      >
        Cancel
      </button>
    </div>
  );
}
