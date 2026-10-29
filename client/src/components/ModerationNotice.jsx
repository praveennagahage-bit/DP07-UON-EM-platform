import { useEffect, useState } from 'react';
import { api } from '../api';

export default function ModerationNotice() {
  const [status, setStatus] = useState(null);
  useEffect(() => { let active = true; api('/moderation/status').then(value => { if (active) setStatus(value); }).catch(() => {}); return () => { active = false; }; }, []);
  return <p className="muted">{status?.mode === 'required'
    ? 'The title, description and location are sent to OpenAI for content safety review before saving. If review is unavailable, the event will not be saved. Contact an administrator if you believe a rejection is incorrect.'
    : status ? 'Event text is checked against the prohibited keyword list. AI review is not enabled.' : 'Event text is subject to content review before saving.'}</p>;
}
