const core = require('@actions/core');
const { S3Client } = require("@aws-sdk/client-s3");

const s3ClientConfig = {
  // RegionInputConfig
  region: 'eu-west-2',

  // AwsAuthInputConfig
  credentials: {
    accessKeyId: core.getInput('s3AccessKeyId'),
    secretAccessKey: core.getInput('s3AccessKey')
  },
};

const s3Client = new S3Client(s3ClientConfig);

// TODO recurstively upload folder structure to S3

// https://gist.github.com/jlouros/9abc14239b0d9d8947a3345b99c4ebcb#gistcomment-2751992

// call send on s3Client with instance of:
// https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/classes/putobjectcommand.html

// Other references:
// - https://www.npmjs.com/package/@actions/core
// - https://github.com/actions/javascript-action
// - https://github.com/actions/upload-artifact

// This repository inspired me as to how simple this might be able to be.
// However, on closer inspection alongside the aws-sdk API reference, I'm not convinced
// that they are doing it in the best or up-to-date manner.
// - https://github.com/shallwefootball/upload-s3-action

// In terms of versioning DO NOT use branches, we JUST will use tags.
// Initial tags will be `v1` and `v1.0.0`
// - https://github.com/actions/toolkit/blob/main/docs/action-versioning.md
