const TONES = [
  { value: 'professional', label: '💼 Professional', title: 'Clear, professional responses' },
  { value: 'casual', label: '😊 Casual', title: 'Friendly, conversational responses' },
  { value: 'concise', label: '⚡ Concise', title: 'Brief, direct responses' },
];

export default function ToneSelector({ tone, onToneChange }) {
  return (
    <div className="tone-selector">
      <span className="tone-label">Tone:</span>
      <div className="tone-options" role="radiogroup" aria-label="Response tone">
        {TONES.map((t) => (
          <button
            key={t.value}
            id={`tone-${t.value}`}
            className={`tone-btn ${tone === t.value ? 'active' : ''}`}
            onClick={() => onToneChange(t.value)}
            role="radio"
            aria-checked={tone === t.value}
            title={t.title}
          >
            {t.label}
          </button>
        ))}
      </div>
    </div>
  );
}
