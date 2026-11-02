# Publishing a Native release

Publication is triggered only by pushing `vVERSION`, matching `packages/native/package.json`, the root version and both workspace consumers. The tag commit must already belong to `main`. A branch push or a GitHub Release description alone does not publish npm.

Before tagging, update the version, lockfile, README and changelog. Verify a packed candidate in the private native playground on Android and iOS. Merge the verified release changes into `main`, then push the version tag.

`.github/workflows/publish.yml` runs the release checks, audits the public archive and transfers that exact checksum-verified tarball to the publication job. It publishes using npm OIDC with provenance. Prereleases get their named channel (`beta`, `rc`, etc.); Native also moves `latest` to the current release, matching the existing default-install policy.

## One-time npm setup

For `@neural-ui/native`, configure a GitHub Actions trusted publisher on npm:

- Owner: `PedroMorenoTrujillo`
- Repository: `neural-native`
- Workflow filename: `publish.yml`
- Environment: leave empty
- Allow direct `npm publish` and `npm dist-tag`

The workflow uses npm 11.21.0 because OIDC authentication for dist-tag operations requires that version or newer. No persistent `NPM_TOKEN` is used. Adding the workflow file alone does not configure npm's trust relationship; verify both sides before relying on automation.

After publication, update the showcase's exact registry dependency, lockfiles, release manifest, version labels, API reference and native captures. Regenerate and test the complete documentation before deploying it.

Reference: [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/).
