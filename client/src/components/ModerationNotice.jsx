import { useEffect, useState } from 'react';
import { api } from '../api';

export default function ModerationNotice({ message = false }) {
  const [status, setStatus] = useState(null);
  useEffect(() => { let active = true; api('/moderation/status').then(value => { if (active) setStatus(value); }).catch(() => {}); return () => { active = false; }; }, []);
  return <p className="muted">{status?.mode === 'required'
    ? message ? 'The subject and message are sent to OpenAI for safety review before delivery. Rejected messages are not sent. If review is unavailable, try again later.' : 'The title, description and location are sent to OpenAI for content safety review before saving. If review is unavailable, the event will not be saved. Contact an administrator if you believe a rejection is incorrect.'
    : status ? (message ? 'Messages are checked against the prohibited keyword list. AI review is not enabled.' : 'Event text is checked against the prohibited keyword list. AI review is not enabled.') : (message ? 'Messages are subject to content review before delivery.' : 'Event text is subject to content review before saving.')}</p>;
}
