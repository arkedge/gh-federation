import type { APIGatewayProxyHandlerV2WithJWTAuthorizer } from "aws-lambda";

import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";
import { createAppAuth } from "@octokit/auth-app";
import { authorize } from "./policy";

function env(name: string): string {
  if (Object.hasOwn(process.env, name)) {
    return process.env[name]!;
  } else {
    throw new Error(`environment variable ${name} is not present`);
  }
}

const APP_SECRET_ID = env("APP_SECRET_ID");
const GITHUB_APP_ID = env("GITHUB_APP_ID");
const GITHUB_APP_INSTALLATION_ID = env("GITHUB_APP_INSTALLATION_ID");
const AWS_REGION = env("AWS_REGION");

const secretmanager = new SecretsManagerClient({
  region: AWS_REGION,
});

type AppSecret = {
  privateKey: string;
};

async function getAppSecret(secretId: string): Promise<AppSecret> {
  const data = await secretmanager.send(
    new GetSecretValueCommand({
      SecretId: secretId,
    })
  );
  const secretString = data.SecretString!;
  return JSON.parse(secretString);
}

const handler: APIGatewayProxyHandlerV2WithJWTAuthorizer = async (event) => {
  const claims = event.requestContext.authorizer.jwt.claims;
  if (!authorize(claims)) {
    return { statusCode: 401 };
  }

  const { privateKey } = await getAppSecret(APP_SECRET_ID);

  const auth = createAppAuth({
    appId: GITHUB_APP_ID,
    privateKey,
  });

  const installationAuthentication = await auth({
    type: "installation",
    installationId: GITHUB_APP_INSTALLATION_ID,
  });

  return {
    statusCode: 200,
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(installationAuthentication),
  };
};

exports.handler = handler;
