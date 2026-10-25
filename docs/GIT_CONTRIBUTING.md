# Commit identity and shared repository workflow

Before contributing from a new computer or checkout, configure your own Git
identity in this repository. Use an email connected to your GitHub account,
preferably a verified address or the exact GitHub-provided noreply address from
your account settings. Do not copy another contributor's identity.

```sh
git config --local user.name "Your Name"
git config --local user.email "YOUR_GITHUB_EMAIL"
git var GIT_AUTHOR_IDENT
git var GIT_COMMITTER_IDENT
```

Check the output before committing: author and committer addresses must both be
correct. GitHub's email settings are at https://github.com/settings/emails.
Changing this configuration affects future commits, not existing commits.

Before pushing, fetch the upstream and inspect any incoming changes. Preserve
teammates' work and resolve overlapping edits. Commit only relevant source or
documentation changes; exclude databases, credentials, dependencies and temporary
test artifacts. Do not force-push shared history or create empty commits merely
to increase activity.

After pushing, check the commit's author link on GitHub. Commit attribution and
the Insights contributors graph are separate checks: statistics may be cached,
and the graph excludes merge and empty commits. If they disagree, compare actual
commit records with graph statistics before considering history changes.

References:
- https://docs.github.com/en/account-and-profile/how-tos/email-preferences/setting-your-commit-email-address
- https://docs.github.com/en/rest/metrics/statistics#best-practices-for-caching
