const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createModerator } = require('../aiModeration');
const body = { title: 'Study group', description: 'Learn together', location: 'Library' };

test('AI moderation sends only event text to the fixed endpoint and uses the provider flag', async () => {
    let flagged = false;
    const moderator = createModerator({ mode: 'required', apiKey: 'test-only', fetchImpl: async (url, options) => {
        assert.equal(url, 'https://api.openai.com/v1/moderations');
        const payload = JSON.parse(options.body);
        assert.equal(payload.model, 'omni-moderation-latest');
        assert.equal(payload.input, 'Title: Study group\nDescription: Learn together\nLocation: Library');
        assert.equal(options.headers.Authorization, 'Bearer test-only');
        return { ok: true, json: async () => ({ results: [{ flagged }] }) };
    } });
    await moderator.check({ ...body, password: 'not-sent', image: 'not-sent' });
    flagged = true;
    await assert.rejects(moderator.check(body), error => error.status === 422);
});
test('Missing configuration, network failure, HTTP failures and malformed AI responses fail closed without leaking secrets', async () => {
    await assert.rejects(createModerator({ mode: 'required', apiKey: '' }).check(body), error => error.status === 503);
    for (const fetchImpl of [
        async () => { throw new Error('sensitive-provider-detail'); },
        async () => ({ ok: false }),
        async () => ({ ok: true, json: async () => ({ results: [] }) }),
        async () => ({ ok: true, json: async () => ({ results: [{ flagged: 'false' }] }) }),
    ]) await assert.rejects(createModerator({ mode: 'required', apiKey: 'test-only', fetchImpl }).check(body), error => error.status === 503 && !error.message.includes('sensitive'));
});
test('AI requests have a bounded timeout and keyword-only mode never calls the provider', async () => {
    const timer = setTimeout(() => {}, 1000);
    try {
        const moderator = createModerator({ mode: 'required', apiKey: 'test-only', timeoutMs: 10, fetchImpl: (url, { signal }) => new Promise((resolve, reject) => {
            signal.addEventListener('abort', () => reject(signal.reason), { once: true });
        }) });
        await assert.rejects(moderator.check(body), error => error.status === 503);
        await createModerator({ mode: 'keywords', fetchImpl: () => { throw new Error('must not call'); } }).check(body);
    } finally { clearTimeout(timer); }
});
