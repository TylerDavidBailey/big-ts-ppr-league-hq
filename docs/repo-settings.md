# How to configure the repository

Settings that cannot be committed to the repo. Apply them once after you fork or create it.

Each step gives the web UI path and the equivalent [GitHub CLI](https://cli.github.com/)
command. Set `REPO` first:

```bash
export REPO=TylerDavidBailey/sleeper-league-hq
```

## Turn on GitHub Pages

The deploy workflow publishes through the Pages API, so the source must be GitHub Actions
rather than a branch.

Go to **Settings → Pages** and set **Source** to **GitHub Actions**.

```bash
gh api -X POST "repos/$REPO/pages" -f build_type=workflow
```

If Pages is already on, switch the existing site instead:

```bash
gh api -X PUT "repos/$REPO/pages" -f build_type=workflow
```

Push to `main` and the site appears at
`https://<your-username>.github.io/<your-repo-name>/`.

## Set the merge behaviour

Squash merging keeps `main` readable, and deleting merged branches keeps the branch list
short.

Go to **Settings → General → Pull Requests**. Enable **Allow squash merging**, disable the
other two, and enable **Automatically delete head branches**.

```bash
gh repo edit "$REPO" \
	--enable-squash-merge \
	--enable-merge-commit=false \
	--enable-rebase-merge=false \
	--delete-branch-on-merge
```

## Protect the main branch

Require CI to pass before anything reaches `main`.

Go to **Settings → Branches** and add a rule for `main`. Require a pull request, and require
both status checks: `Lint, typecheck, test, build` and `Browser tests`. Those strings are
the `name:` of each job in `.github/workflows/ci.yml`. If you rename a job, update the
protection rule in the same commit or nothing will ever be mergeable again.

```bash
gh api -X PUT "repos/$REPO/branches/main/protection" \
	--input - <<'JSON'
{
	"required_status_checks": {
		"strict": true,
		"contexts": ["Lint, typecheck, test, build", "Browser tests"]
	},
	"enforce_admins": false,
	"required_pull_request_reviews": {
		"required_approving_review_count": 1,
		"dismiss_stale_reviews": true
	},
	"restrictions": null,
	"allow_force_pushes": false,
	"allow_deletions": false
}
JSON
```

Working alone, set `required_approving_review_count` to `0`. The status check still gates
the merge.

## Allow the player refresh workflow to open pull requests

`refresh-players.yml` commits a regenerated player index on a branch and opens a pull
request. That needs write access for `GITHUB_TOKEN`.

Go to **Settings → Actions → General → Workflow permissions**. Select **Read and write
permissions** and enable **Allow GitHub Actions to create and approve pull requests**.

```bash
gh api -X PUT "repos/$REPO/actions/permissions/workflow" \
	-f default_workflow_permissions=write \
	-F can_approve_pull_request_reviews=true
```

## Describe the repository

The description and topics are what people see when you share the link.

```bash
gh repo edit "$REPO" \
	--description "Standings, scoreboards, playoff brackets and season awards for any Sleeper fantasy football league." \
	--homepage "https://tylerdavidbailey.github.io/sleeper-league-hq/" \
	--add-topic fantasy-football \
	--add-topic sleeper \
	--add-topic react \
	--add-topic typescript \
	--add-topic github-pages
```

## Optional: turn off unused features

The project has no wiki and no packages.

```bash
gh repo edit "$REPO" --enable-wiki=false --enable-projects=false
```

## Verify

```bash
gh api "repos/$REPO/pages" --jq '.build_type, .html_url'
gh api "repos/$REPO/branches/main/protection" --jq '.required_status_checks.contexts'
gh run list --repo "$REPO" --limit 5
```
