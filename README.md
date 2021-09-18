# Ably SDK Team Upload Action

This action automates the deployment of generated artifacts to our Ably SDK team AWS S3 bucket.

## Usage

See [action.yml](action.yml) for explanations of each input.

```yaml
steps:
  - uses: ably/sdk-upload-action@v1
    with:
      s3AccessKeyId: ${{ secrets.SDK_S3_ACCESS_KEY_ID }}
      s3AccessKey: ${{ secrets.SDK_S3_ACCESS_KEY }}
      sourcePath: doc/api
      githubToken: ${{ secrets.GITHUB_TOKEN }}
      artifactName: dartdoc
```

In the above example, `githubToken` uses the `GITHUB_TOKEN` secret which is automatically supplied to GitHub runners so you don't need to do anything to access it. `s3AccessKeyId` and `s3AccessKey` are accessed as [encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) as these should not be exposed to the public domain.

Artifacts generated from pull requests will be uploaded to `https://sdk.ably.io/builds/ably/${repository_name}/pull/${pull_number}/${artifactName}` and artifacts generated from pushes to the main branch will be uploaded to `https://sdk.ably.io/builds/ably/${repository_name}/main/${artifactName}`.

## Permissions

The `githubToken` requires `write` access to the `deployments` permissions scope.
This means that workflows using this action in a repository that is owned by an org with the default access level for actions set to 'restricted' will need to explicitly specify this requirement in the workflow using [permissions](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#permissions), something like this:

```yml
permissions:
  deployments: write
```

See also:

- GitHub docs: [Authentication in a workflow: Permissions for the `GITHUB_TOKEN`](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#permissions-for-the-github_token)
- GitHub's Youtube channel: [GitHub Actions: Limit workflow runs & Control permissions for GITHUB_TOKEN](https://youtu.be/JMHs5lYpvAM?t=483)

## Contributing

For guidance on how to contribute to this project, see the [CONTRIBUTING.md](CONTRIBUTING.md).
