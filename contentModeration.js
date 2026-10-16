const normalize = value => value.normalize('NFKC').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').toLowerCase().replace(/\s+/gu, ' ').trim();

async function checkEventKeywords(db, body) {
    const rules = await db.all('SELECT normalized FROM blocked_keywords WHERE enabled = 1');
    for (const field of ['title', 'description', 'location']) {
        const value = normalize(typeof body[field] === 'string' ? body[field] : '');
        if (rules.some(rule => value.includes(rule.normalized))) {
            throw Object.assign(new Error('The ' + field + ' contains a prohibited phrase. Revise the content before publishing.'), { status: 400 });
        }
    }
}
module.exports = { normalize, checkEventKeywords };
