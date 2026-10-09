export const LIMITS = { title: 30, description: 500, location: 120, capacity: 10000, name: 50, bio: 300 };
export const characterCount = value => Array.from(value || '').length;
export const cleanText = value => typeof value === 'string' ? value.trim() : '';
// Plain-text validation supplements React text rendering and parameterized SQL.
export function textError(value, label, max, required = false) {
  if (typeof value !== 'string') return label + ' must be text.';
  if (required && !value.trim()) return label + ' is required.';
  if (characterCount(value.trim()) > max) return label + ' must be ' + max + ' characters or fewer (including spaces and punctuation).';
  if (/[<>]|\b(?:javascript|vbscript)\s*:|data\s*:\s*text\/html/i.test(value) || /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value)) return label + ' must be plain text without HTML tags, script URLs or control characters.';
  return '';
}
export function eventInputErrors(body) {
  const errors = {};
  for (const field of ['title', 'description', 'location']) {
    const error = textError(body[field] ?? '', field[0].toUpperCase() + field.slice(1), LIMITS[field], field !== 'description');
    if (error) errors[field] = error;
  }
  if (!errors.location && !/\p{L}/u.test(body.location || '')) errors.location = 'Location must include a venue or room name, for example Room 201 or Online.';
  if (!errors.title && !/[\p{L}\p{N}]/u.test(body.title || '')) errors.title = 'Title must contain a letter or number.';
  if (!Number.isSafeInteger(body.capacity) || body.capacity < 1 || body.capacity > LIMITS.capacity) errors.capacity = 'Capacity must be a whole number from 1 to ' + LIMITS.capacity + '.';
  return errors;
}
export function profileInputErrors(body) {
  const errors = {};
  for (const field of ['firstName', 'lastName', 'bio']) {
    const label = { firstName: 'First name', lastName: 'Last name', bio: 'Bio' }[field];
    const error = textError(body[field] ?? '', label, field === 'bio' ? LIMITS.bio : LIMITS.name, field !== 'bio');
    if (error) errors[field] = error;
  }
  return errors;
}
