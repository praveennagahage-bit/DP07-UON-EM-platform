import { useId, useState } from 'react';
import './TimePicker.css';

const pad = number => String(number).padStart(2, '0');

export default function TimePicker({ value, onChange, disabled = false }) {
  const id = useId();
  const [step, setStep] = useState(null);
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');
  function open() {
    const [h = '00', m = '00'] = value ? value.split(':') : [];
    setHour(h); setMinute(m); setStep('hour');
  }
  function close() {
    setStep(null);
    document.getElementById(id + '-trigger')?.focus();
  }
  return <div className="time-picker">
    <span id={id + '-label'}>Time (24-hour)</span>
    <button id={id + '-trigger'} className="time-picker-trigger" type="button" disabled={disabled}
      aria-labelledby={id + '-label ' + id + '-value'} aria-expanded={Boolean(step)}
      aria-controls={step ? id + '-panel' : undefined} onClick={() => step ? close() : open()}>
      <span id={id + '-value'}>{value || 'Select time'}</span><span aria-hidden="true">▾</span>
    </button>
    {step && <div id={id + '-panel'} className="time-picker-panel" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); }
      if (event.key === 'Enter' && event.target.tagName === 'SELECT') event.preventDefault();
    }}>
      <label htmlFor={id + '-list'}>{step === 'hour' ? '1. Choose hour' : '2. Choose minute'}
        {step === 'minute' && <span className="muted"> — {hour}:••</span>}
      </label>
      <p className="muted">Drag the scrollbar on the right, click a number, or use the arrow keys.</p>
      <select key={step} id={id + '-list'} size={6} autoFocus
        value={step === 'hour' ? hour : minute}
        onChange={event => step === 'hour' ? setHour(event.target.value) : setMinute(event.target.value)}>
        {Array.from({ length: step === 'hour' ? 24 : 60 }, (_, number) =>
          <option key={number} value={pad(number)}>{pad(number)}</option>)}
      </select>
      <div className="actions">
        {step === 'minute' && <button type="button" className="action secondary" onClick={() => setStep('hour')}>Back to hours</button>}
        <button type="button" className="action secondary" onClick={close}>Cancel</button>
        <button type="button" className="action" onClick={() => {
          if (step === 'hour') setStep('minute');
          else { onChange(hour + ':' + minute); close(); }
        }}>{step === 'hour' ? 'Next: minutes' : 'Set time'}</button>
      </div>
    </div>}
  </div>;
}
