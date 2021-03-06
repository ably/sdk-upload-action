import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { S3Client, S3ClientConfig, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import { lookup } from 'mime-types';
import * as glob from '@actions/glob';

const githubEventPath = process.env.GITHUB_EVENT_PATH;
const githubRef = process.env.GITHUB_REF;

if (typeof githubEventPath !== 'string') {
    core.setFailed('GITHUB_EVENT_PATH environment variable not set');
    process.exit(1);
}

if (typeof githubRef !== 'string') {
    core.setFailed('GITHUB_REF environment variable not set');
    process.exit(1);
}

const githubToken = core.getInput('githubToken');
const octokit = getOctokit(githubToken);

const evt = JSON.parse(fs.readFileSync(githubEventPath, 'utf8'));

const createRef = (githubRef: string) => {
  // githubRef is in the form 'refs/heads/branch_name' or 'refs/tags/tag_name'
  const components = githubRef.split('/')

  const refTypePlural = components[1]
  let refType: 'head' | 'tag'

  switch (refTypePlural) {
    case 'heads': {
      refType = 'head'
      break
    }
    case 'tags': {
      refType = 'tag'
      break
    }
    default: {
      return null
    }
  }

  return {
    type: refType,
    name: components.slice(2).join('/')
  }
}

const ref = createRef(githubRef)

const bucketName = 'sdk.ably.com';
const sourcePath = path.resolve(core.getInput('sourcePath'));
const artifactName = core.getInput('artifactName');

let deploymentRef: string;
let keyPrefix = `builds/${context.repo.owner}/${context.repo.repo}/`;
let environment = 'staging/';
if (context.eventName === 'pull_request') {
    deploymentRef = evt.pull_request.head.sha;
    keyPrefix += `pull/${evt.pull_request.number}`;
    environment += `pull/${evt.pull_request.number}`;
} else if (context.eventName === 'push' && ref !== null && ref.type === 'head' && ref.name === 'main') {
    deploymentRef = context.sha;
    keyPrefix += 'main';
    environment += 'main';
} else if (context.eventName === 'push' && ref !== null && ref.type === 'tag') {
    deploymentRef = context.sha;
    keyPrefix += `tag/${ref.name}`;
    environment += `tag/${ref.name}`;
} else {
    core.setFailed("Error: this action can only be ran on a pull_request, a push to the 'main' branch, or a push of a tag");
    process.exit(1);
}
keyPrefix += ('/' + artifactName);
environment += ('/' + artifactName);

core.debug(`keyPrefix: ${keyPrefix}`);
core.debug(`environment: ${environment}`);

const s3ClientConfig: S3ClientConfig = {
    // RegionInputConfig
    region: 'eu-west-2',
};

if(core.getInput('s3AccessKeyId') && core.getInput('s3AccessKey')) {
    core.warning('Setting s3AccessKeyId and s3AccessKey is deprecated, please switch to using the aws-actions/configure-aws-credentials action with GitHub OIDC.');
    s3ClientConfig.credentials = {
        accessKeyId: core.getInput('s3AccessKeyId'),
        secretAccessKey: core.getInput('s3AccessKey')
    };
}

const s3Client = new S3Client(s3ClientConfig);

const upload = async (params: PutObjectCommandInput) => {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    core.info(`uploaded: ${params.Key}`);
}

const createDeployment = async () => {
    const response = await octokit.repos.createDeployment({
        ...context.repo,
        ref: deploymentRef,
        task: artifactName,
        required_contexts: [],
        environment,
        auto_merge: false,
    });
    if (![201, 202].includes(response.status)) {
        core.setFailed(`Failed to create deployment, received ${response.status} response status`);
        process.exit(1);
    }

    // Typescript can't infer from the above that response.data.id will be a number now so we have to type cast
    return (response.data as { id: number }).id;
}

const setDeploymentStatus = async (id: number, state: 'in_progress' | 'success' | 'failure', url?: string) => {
    await octokit.repos.createDeploymentStatus({
        ...context.repo,
        deployment_id: id,
        state,
        log_url: url,
        target_url: url,
        environment_url: url,
        mediaType: {
            // 'flash' is needed to use the 'in_progress' state
            // 'ant-man' is needed to use the log_url property
            //  see https://octokit.github.io/rest.js/v18#repos-create-deployment-status
            previews: ['flash', 'ant-man'],
        },
    });
}

const run = async () => {
    const globber = await glob.create(`${sourcePath}/**`);
    const allFiles = await globber.glob();

    if (allFiles.length === 0) {
        throw new Error(`No files found in sourcePath: ${sourcePath}`);
    }

    const deploymentId = await createDeployment();
    await setDeploymentStatus(deploymentId, 'in_progress');

    try {
        await Promise.all(allFiles.filter(file => !fs.statSync(file).isDirectory()).map(file => {
            const body = fs.readFileSync(file);
            core.debug(`sourcePath: ${sourcePath}`);
            core.debug(`file: ${file}`);
            const key = path.join(keyPrefix, path.relative(sourcePath, file));
            core.debug(`resulting key: ${key}`);
            return upload({
                Key: key,
                Bucket: bucketName,
                Body: body,
                ACL: 'public-read',
                ContentType: lookup(file) || 'application/octet-stream',
            });
        }));
        await setDeploymentStatus(deploymentId, 'success', `https://${bucketName}/${keyPrefix}/`);
    } catch (err) {
        await setDeploymentStatus(deploymentId, 'failure');
        throw err;
    }
}

run().catch(err => {
    core.setFailed(err.message);
});
