import core from '@actions/core';
import github, { context } from '@actions/github';
import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import path from "path";
import fs from "fs";
import { lookup } from 'mime-types';

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
const octokit = github.getOctokit(githubToken);

const evt = JSON.parse(fs.readFileSync(githubEventPath, 'utf8'));

// githubRef is in the form 'refs/heads/branch_name' so we have to slice away the 'refs/heads/' bit
const branchName = githubRef.split('/').slice(2).join('/');

const bucketName = 'sdk.ably.com';
const sourcePath = path.resolve(core.getInput('sourcePath'));
const destinationPath = path.resolve(core.getInput('destinationPath') ?? '');
const taskName = core.getInput('taskName');

let deploymentRef: string;
let keyPrefix = `builds/${context.repo.owner}/${context.repo.repo}/`;
if (context.eventName === 'pull_request') {
    deploymentRef = evt.pull_request.head.sha;
    keyPrefix += `pull/${evt.pull_request.number}/`;
} else if (context.eventName === 'push' && branchName === 'main') {
    deploymentRef = context.sha;
    keyPrefix += 'main/';
} else {
    core.setFailed("Error: this action can only be ran on a pull_request or a push to the 'main' branch");
    process.exit(1);
}
keyPrefix += destinationPath;

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

const listFiles = (dir: string) => {
    let files: string[] = [];
    const filesInDir = fs.readdirSync(dir);
    filesInDir.forEach(file => {
        const name = `${dir}/${file}`;
        if (fs.statSync(name).isDirectory()) {
            files.push(...listFiles(name));
        } else {
            files.push(name);
        }
    });

    return files;
}

const allFiles = listFiles(sourcePath);

const upload = async (params: PutObjectCommandInput) => {
    const command = new PutObjectCommand(params);
    await s3Client.send(command);
    core.info(`uploaded: ${params.Key}`);
}

const createDeployment = async () => {
    const response = await octokit.repos.createDeployment({
        ...context.repo,
        ref: deploymentRef,
        task: taskName,
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
        mediaType: {
            // 'flash' is needed to use the 'in_progress' state
            // 'ant-man' is needed to use the log_url property
            //  see https://octokit.github.io/rest.js/v18#repos-create-deployment-status
            previews: ['flash', 'ant-man'],
        },
    });
}

const run = async () => {
    const deploymentId = await createDeployment();
    await setDeploymentStatus(deploymentId, 'in_progress');
    try {
        await Promise.all(allFiles.map(file => {
            const body = fs.readFileSync(file);
            const key = keyPrefix + path.relative(sourcePath, file);
            return upload({
                Key: key,
                Bucket: bucketName,
                Body: body,
                ACL: 'public-read',
                ContentType: lookup(file) || 'text/plain',
            });
        }));
        await setDeploymentStatus(deploymentId, 'success', `https://${bucketName}/${keyPrefix}/`);
    } catch (err) {
        await setDeploymentStatus(deploymentId, 'failure');
        throw err;
    }
}

run().catch(err => {
    core.error(err);
    core.setFailed(err.message);
});
