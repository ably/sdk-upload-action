# Ably SDK Team Upload Action

This action automates the deployment of generated artifacts to our Ably SDK team AWS S3 bucket.

# Usage

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
