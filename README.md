# Ably SDK Team Upload Action

This action automates the deployment of generated artifacts to our Ably SDK team AWS S3 bucket.

# Usage

See [action.yml](action.yml).

```yaml
steps:
  - uses: ably/sdk-upload-action@v1
    with:
      s3AccessKeyId: ${{ secrets.SDK_S3_ACCESS_KEY_ID }}
      s3AccessKey: ${{ secrets.SDK_S3_ACCESS_KEY }}
      sourcePath: doc/api
      githubToken: ${{ secrets.GITHUB_TOKEN }}
      artifactName: dartdoc
      destinationPath: my/destination/path # Optional input
```

In the above example, `githubToken` uses the `GITHUB_TOKEN` secret which is automatically supplied to GitHub runners so you don't need to do anything to access it. `s3AccessKeyId` and `s3AccessKey` are accessed as [encrypted secrets](https://docs.github.com/en/actions/reference/encrypted-secrets) as these should not be exposed to the public domain. The `sourcePath` input is the path to a directory containing the files to be uploaded. The `artifactName` input is a unique name for the artifact being uploaded. In this example the action has been configured to upload a static `dartdoc` site which has been generated at `doc/api` so the `artifactName` is set to `dartdoc`. If you are uploading multiple artifacts from the same repository using this action you must ensure that each time the action is run it uses a unique `artifactName`. The `destinationPath` input is an optional input which specifies a relative path inside the S3 bucket to upload artifacts.

Artifacts generated from pull requests will be uploaded to `https://sdk.ably.io/builds/ably/${repository_name}/pull/${pull_number}/${destinationPath?}` and artifacts generated from pushes to the main branch will be uploaded to `https://sdk.ably.io/builds/ably/${repository_name}/main/${destinationPath?}`.
