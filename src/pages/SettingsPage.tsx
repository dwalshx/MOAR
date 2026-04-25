import { useState } from 'react';
import { useNavigate } from 'react-router';
import { settingsService, type Bar } from '../services/settingsService';

export default function SettingsPage() {
  const navigate = useNavigate();

  // Snapshot settings into local state
  const [bodyWeight, setBodyWeightLocal] = useState(
    settingsService.getBodyWeight()?.toString() ?? ''
  );
  const [bars, setBarsLocal] = useState<Bar[]>(settingsService.getBars());
  const [plates, setPlatesLocal] = useState<number[]>(settingsService.getPlates());
  const [plateMode, setPlateModeLocal] = useState(settingsService.getPlateMode());
  const [newPlate, setNewPlate] = useState('');
  const [newBarName, setNewBarName] = useState('');
  const [newBarWeight, setNewBarWeight] = useState('');

  const saveBodyWeight = (v: string) => {
    setBodyWeightLocal(v);
    const n = parseFloat(v);
    if (!isNaN(n) && n > 0) settingsService.setBodyWeight(n);
  };

  const updateBar = (id: string, patch: Partial<Bar>) => {
    const updated = bars.map(b => (b.id === id ? { ...b, ...patch } : b));
    setBarsLocal(updated);
    settingsService.setBars(updated);
  };

  const removeBar = (id: string) => {
    const updated = bars.filter(b => b.id !== id);
    setBarsLocal(updated);
    settingsService.setBars(updated);
  };

  const addBar = () => {
    const name = newBarName.trim();
    const weight = parseFloat(newBarWeight);
    if (!name || isNaN(weight) || weight <= 0) return;
    const id = name.toLowerCase().replace(/\s+/g, '-').slice(0, 20) + '-' + Date.now().toString(36);
    const updated = [...bars, { id, name, weight }];
    setBarsLocal(updated);
    settingsService.setBars(updated);
    setNewBarName('');
    setNewBarWeight('');
  };

  const addPlate = () => {
    const w = parseFloat(newPlate);
    if (isNaN(w) || w <= 0 || plates.includes(w)) return;
    const updated = [...plates, w].sort((a, b) => b - a);
    setPlatesLocal(updated);
    settingsService.setPlates(updated);
    setNewPlate('');
  };

  const removePlate = (p: number) => {
    const updated = plates.filter(x => x !== p);
    setPlatesLocal(updated);
    settingsService.setPlates(updated);
  };

  const togglePlateMode = (val: boolean) => {
    setPlateModeLocal(val);
    settingsService.setPlateMode(val);
  };

  return (
    <div className="pt-6 pb-4 flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <button
          onClick={() => navigate(-1)}
          className="text-accent font-semibold min-h-[44px] active:opacity-80 transition-opacity"
        >
          &larr; Back
        </button>
        <h1 className="text-2xl font-bold text-text-primary ml-2">Settings</h1>
      </div>

      {/* Body weight */}
      <Section title="Body Weight" hint="Used for bodyweight exercises (pushups, pullups, dips) when computing volume.">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={bodyWeight}
            onChange={(e) => saveBodyWeight(e.target.value)}
            placeholder="185"
            className="bg-bg-card border border-border rounded-lg px-3 py-2 w-24
                       text-text-primary text-center outline-none focus:border-accent"
          />
          <span className="text-text-secondary text-sm">lbs</span>
        </div>
      </Section>

      {/* Plate mode */}
      <Section title="Plate Mode" hint="Replaces the +/- weight stepper with plate-pair buttons (e.g., +45, +25). Adding a 45 plate to each side adds 90 lbs total.">
        <label className="flex items-center gap-3 cursor-pointer">
          <span className="relative inline-block w-11 h-6 flex-shrink-0">
            <input
              type="checkbox"
              checked={plateMode}
              onChange={(e) => togglePlateMode(e.target.checked)}
              className="sr-only peer"
            />
            <span className="absolute inset-0 bg-bg-card border border-border rounded-full peer-checked:bg-accent peer-checked:border-accent transition-colors" />
            <span className="absolute left-1 top-1 w-4 h-4 bg-text-primary rounded-full transition-transform peer-checked:translate-x-5" />
          </span>
          <span className="text-text-primary text-sm">{plateMode ? 'On' : 'Off'}</span>
        </label>
      </Section>

      {/* Bars */}
      <Section title="Bars" hint="Bars set the starting weight for an exercise. Tap an exercise's bar selector to assign one.">
        <div className="flex flex-col gap-2">
          {bars.map(bar => (
            <div key={bar.id} className="flex items-center gap-2 bg-bg-card rounded-lg px-3 py-2">
              <input
                type="text"
                value={bar.name}
                onChange={(e) => updateBar(bar.id, { name: e.target.value })}
                className="bg-transparent text-text-primary text-sm outline-none flex-1 min-w-0"
              />
              <input
                type="number"
                value={bar.weight}
                onChange={(e) => updateBar(bar.id, { weight: parseFloat(e.target.value) || 0 })}
                className="bg-bg-secondary border border-border rounded px-2 py-1 w-20
                           text-text-primary text-sm text-center outline-none focus:border-accent"
              />
              <span className="text-text-secondary text-xs">lbs</span>
              <button
                onClick={() => removeBar(bar.id)}
                className="text-red-400/60 active:text-red-400 px-1"
                aria-label="Remove bar"
              >
                ×
              </button>
            </div>
          ))}
          <div className="flex items-center gap-2 bg-bg-card/50 rounded-lg px-3 py-2 border border-dashed border-border">
            <input
              type="text"
              value={newBarName}
              onChange={(e) => setNewBarName(e.target.value)}
              placeholder="Bar name"
              className="bg-transparent text-text-primary text-sm outline-none flex-1 min-w-0 placeholder-text-secondary"
            />
            <input
              type="number"
              value={newBarWeight}
              onChange={(e) => setNewBarWeight(e.target.value)}
              placeholder="Weight"
              className="bg-bg-secondary border border-border rounded px-2 py-1 w-20
                         text-text-primary text-sm text-center outline-none focus:border-accent placeholder-text-secondary"
            />
            <span className="text-text-secondary text-xs">lbs</span>
            <button
              onClick={addBar}
              className="text-accent text-sm font-semibold px-2 active:opacity-80"
            >
              Add
            </button>
          </div>
        </div>
      </Section>

      {/* Plates */}
      <Section title="Plates" hint="Plate sizes for the breakdown calculator and plate-mode buttons. Per side weight.">
        <div className="flex flex-wrap gap-2">
          {plates.map(p => (
            <button
              key={p}
              onClick={() => removePlate(p)}
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 text-sm
                         text-text-primary active:text-red-400 transition-colors"
              aria-label={`Remove ${p} lb plate`}
            >
              {p} lbs <span className="text-text-secondary text-xs ml-1">×</span>
            </button>
          ))}
          <div className="flex items-center gap-1">
            <input
              type="number"
              step="0.5"
              value={newPlate}
              onChange={(e) => setNewPlate(e.target.value)}
              placeholder="Add plate"
              className="bg-bg-card border border-border rounded-lg px-3 py-1.5 w-28 text-sm
                         text-text-primary text-center outline-none focus:border-accent placeholder-text-secondary"
            />
            <button
              onClick={addPlate}
              className="text-accent text-sm font-semibold px-2 active:opacity-80"
            >
              Add
            </button>
          </div>
        </div>
      </Section>
    </div>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="text-text-primary text-base font-semibold">{title}</h2>
      {hint && <p className="text-text-secondary text-xs mt-1 mb-3">{hint}</p>}
      {children}
    </div>
  );
}
