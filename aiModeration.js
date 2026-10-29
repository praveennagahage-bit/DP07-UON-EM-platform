const failure = message => Object.assign(new Error(message), { status: 503, publicMessage: true });

function createModerator({ apiKey = process.env.OPENAI_API_KEY, mode = process.env.AI_MODERATION_MODE || (apiKey ? 'required' : 'keywords'), fetchImpl = globalThis.fetch, timeoutMs = 8000 } = {}) {
    if (!['required', 'keywords'].includes(mode)) throw new Error('AI_MODERATION_MODE must be required or keywords');
    return {
        status: { mode, configured: Boolean(apiKey), model: 'omni-moderation-latest' },
        async check(body) {
            if (mode === 'keywords') return;
            if (!apiKey) throw failure('AI content review is not configured. Please contact an administrator; the event has not been saved.');
            let result;
            try {
                const response = await fetchImpl('https://api.openai.com/v1/moderations', {
                    method: 'POST', signal: AbortSignal.timeout(timeoutMs),
                    headers: { Authorization: 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ model: 'omni-moderation-latest', input: ['Title: ' + body.title, 'Description: ' + (body.description || ''), 'Location: ' + body.location].join('\n') }),
                });
                if (!response.ok) throw new Error('Provider unavailable');
                const data = await response.json();
                if (data.results?.length !== 1 || typeof data.results[0].flagged !== 'boolean') throw new Error('Invalid moderation result');
                result = data.results[0];
            } catch {
                throw failure('AI content review is temporarily unavailable. Please retry later; the event has not been saved.');
            }
            if (result.flagged) throw Object.assign(new Error('AI review flagged potentially harmful event content. Please revise the title, description or location. If this seems incorrect, contact an administrator for review.'), { status: 422 });
        },
    };
}
module.exports = { createModerator };
