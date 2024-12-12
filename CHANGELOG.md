# Changelog

## [2.2.0](https://github.com/ably/sdk-upload-action/tree/v2.2.0)

[Full Changelog](https://github.com/ably/sdk-upload-action/compare/v2.1.0...v2.2.0)

[\#57](https://github.com/ably/sdk-upload-action/pull/57) introduces a way to navigate to a particular page when viewing a deployment:
[\#58](https://github.com/ably/sdk-upload-action/pull/58) adds related I/O for obtaining the `base-path` ahead of artifact build.:


- `landingPagePath` input
- `base-path` output

## [2.1.0](https://github.com/ably/sdk-upload-action/tree/v2.1.0)

[Full Changelog](https://github.com/ably/sdk-upload-action/compare/v2.0.0...v2.1.0)

[\#53](https://github.com/ably/sdk-upload-action/pull/53) adds related I/O for obtaining the URL base on `sdk.ably.com` ahead of artifact build.:

- `mode` input
- `url-base` output

## [2.0.0](https://github.com/ably/sdk-upload-action/tree/v2.0.0)

[Full Changelog](https://github.com/ably/sdk-upload-action/compare/v1.3.0...v2.0.0)

This release includes the following breaking changes:

- Removes support for S3 Access Key to be used to directly specify the IAM user.
  GitHub OIDC is now required.
- Enforces that the `githubToken` and `sourcePath` inputs are supplied when the Action is run.

And the following new feature:

- The `artifactName` Action input is now optional, allowing artifacts to be uploaded to the root of the deployment context.

**Merged pull requests:**

- Enforce that required inputs are supplied [\#47](https://github.com/ably/sdk-upload-action/pull/47) ([QuintinWillison](https://github.com/QuintinWillison))
- Make `artifactName` input optional [\#46](https://github.com/ably/sdk-upload-action/pull/46) ([QuintinWillison](https://github.com/QuintinWillison))
- Remove deprecated S3 access method [\#44](https://github.com/ably/sdk-upload-action/pull/44) ([QuintinWillison](https://github.com/QuintinWillison))
- Move+Sync Node.js versions to Active LTS and add check workflow [\#43](https://github.com/ably/sdk-upload-action/pull/43) ([QuintinWillison](https://github.com/QuintinWillison))
