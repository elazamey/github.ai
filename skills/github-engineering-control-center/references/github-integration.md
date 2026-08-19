# GitHub Integration Reference

## Safe order of operations

1. Commit the workflow and templates.
2. Push to the default branch or a controlled test branch.
3. Wait for the workflow run associated with the new SHA.
4. Verify the workflow conclusion is `success`.
5. Only then attempt branch protection, and only if the repository plan supports it.

## Branch protection staging

Keep a human-readable policy in `.github/branch-protection/main-policy.json` with a status such as `PREPARED_NOT_ENABLED`. Keep the exact API payload separate if an API call is needed; do not send documentation-only fields such as `status` or `reason` to the API.

Recommended policy properties are strict required status checks, at least one approving review, stale-review dismissal, no force pushes, and no branch deletion. Use the exact required check name emitted by the workflow job.

## Plan limitation handling

If GitHub returns a 403 indicating that a private repository requires GitHub Pro or a public repository for branch protection, do not change repository visibility automatically. Keep the policy prepared, record the limitation in the final status, and provide the user with the two choices: upgrade the GitHub plan or make the repository public after an explicit decision.

## Project registration

A project profile records the repository URL, default branch, current Gate, baseline, owner, deployment URL, available commands, and latest Evidence. Registering a project does not mean that its tests, build, security, or deployment passed. If no manifest or command exists, use `NOT_CONFIGURED`.
