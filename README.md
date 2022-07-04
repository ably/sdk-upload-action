# Ably SDK Team Upload Action

This action automates the deployment of generated artifacts to our Ably SDK team AWS S3 bucket.

## Usage

See [action.yml](action.yml) for explanations of each input.

```yaml
permissions:
  deployments: write
  id-token: write
steps:
  - uses: aws-actions/configure-aws-credentials@v1
    with:
      aws-region: eu-west-2
      role-to-assume: arn:aws:iam::${{ secrets.ABLY_AWS_ACCOUNT_ID_SDK }}:role/ably-sdk-builds-<REPO-NAME>
      role-session-name: "${{ github.run_id }}-${{ github.run_number }}"
  - uses: ably/sdk-upload-action@v1
    with:
      sourcePath: doc/api
      githubToken: ${{ secrets.GITHUB_TOKEN }}
      artifactName: dartdoc
```

In the above example, `<REPO-NAME>` should be the Ably repository name (e.g. `ably-js`), and `githubToken` uses the `GITHUB_TOKEN` secret which is automatically supplied to GitHub runners so you don't need to do anything to access it.

Artifacts generated from pull requests will be uploaded to `https://sdk.ably.com/builds/ably/${repository_name}/pull/${pull_number}/${artifactName}` and artifacts generated from pushes to the main branch will be uploaded to `https://sdk.ably.com/builds/ably/${repository_name}/main/${artifactName}`.

## Permissions

### AWS

This action expects the calling repository to be configured to use [GitHub OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services) to obtain access to AWS resources within the Ably organization. This requires that the repository has an IAM role configured by Ably's internal Terraform deployment which can be used by [aws-actions/configure-aws-credentials](https://github.com/aws-actions/configure-aws-credentials) to retrieve temporary AWS access, for example:

```yaml
- uses: aws-actions/configure-aws-credentials@v1
  with:
    aws-region: eu-west-2
    role-to-assume: arn:aws:iam::${{ secrets.ABLY_AWS_ACCOUNT_ID_SDK }}:role/ably-sdk-builds-ably-js
    role-session-name: "${{ github.run_id }}-${{ github.run_number }}"
```

The `configure-aws-credentials` action also needs `write` permissions for `id-token` in order to use a GitHub issued ID token to authenticate with AWS:

```yaml
permissions:
  id-token: write
```

If you are unsure whether the appropriate IAM role has been configured, please speak to the Ably SDK team.

### `githubToken`

The `githubToken` requires `write` access to the `deployments` permissions scope.
This means that workflows using this action in a repository that is owned by an org with the default access level for actions set to 'restricted' will need to explicitly specify this requirement in the workflow using [permissions](https://docs.github.com/en/actions/reference/workflow-syntax-for-github-actions#permissions), something like this:

```yml
permissions:
  deployments: write
```

When permissions haven't been correctly configured for a job using this action as a step, the error message displayed by GitHub's workflow runner has been observed to present in the log output like this:

```
Error: Resource not accessible by integration
```

See also:

- GitHub docs: [Authentication in a workflow: Permissions for the `GITHUB_TOKEN`](https://docs.github.com/en/actions/reference/authentication-in-a-workflow#permissions-for-the-github_token)
- GitHub's Youtube channel: [GitHub Actions: Limit workflow runs & Control permissions for GITHUB_TOKEN](https://youtu.be/JMHs5lYpvAM?t=483)

## Contributing

For guidance on how to contribute to this project, see the [CONTRIBUTING.md](CONTRIBUTING.md).
