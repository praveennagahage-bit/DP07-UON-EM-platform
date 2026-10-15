// Run only from a trusted local terminal; never expose this operation as an API.
const { createDatabase } = require('../database');
async function grantAdmin(db, email) {
  return db.transaction(async tx => {
    const user = await tx.get('SELECT id, role, status FROM users WHERE lower(trim(email)) = ?', [email.trim().toLowerCase()]);
    if (!user) throw new Error('Register this account normally first, then run this command again.');
    if (user.status !== 'active') throw new Error('A suspended account cannot become an administrator.');
    if (user.role === 'admin') return false;
    if (await tx.get("SELECT id FROM users WHERE role = 'admin' LIMIT 1")) throw new Error('An administrator already exists. Use Administration to assign further administrators.');
    await tx.run("UPDATE users SET role = 'admin' WHERE id = ?", [user.id]);
    await tx.run('DELETE FROM sessions WHERE userId = ?', [user.id]);
    await tx.run("INSERT INTO admin_audit (actorId, action, targetType, targetId, reason, details) VALUES (?, 'grant_admin', 'user', ?, 'Granted by trusted local CLI', ?)",
      [user.id, user.id, JSON.stringify({ previousRole: user.role, channel: 'local_cli' })]);
    return true;
  });
}
if (require.main === module) {
  const [email, confirmation] = process.argv.slice(2);
  if (!email || confirmation !== '--confirm') {
    console.error('Usage: npm run admin:grant -- registered-email@example.com --confirm');
    process.exitCode = 1;
  } else (async () => {
    const db = await createDatabase();
    try { console.log(await grantAdmin(db, email) ? 'Administrator granted. Sign in again to use Administration.' : 'This account is already an administrator.'); }
    finally { await db.close(); }
  })().catch(error => { console.error(error.message); process.exitCode = 1; });
}
module.exports = { grantAdmin };
