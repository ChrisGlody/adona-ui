/**
 * Cognito config — same env vars as adona-sst and adona-ui sst.config.ts.
 * When running with SST (`pnpm dev:sst` or `pnpm deploy`), these are set by
 * sst.config.ts (UserPool, Web client, region). Otherwise set them in .env.
 */

/** Default AWS region — matches adona-sst app.providers.aws.region in sst.config.ts */
export const DEFAULT_AWS_REGION = "us-east-1";

export const COGNITO = {
  userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID,
  userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID,
  region: process.env.NEXT_PUBLIC_AWS_REGION ?? DEFAULT_AWS_REGION,
} as const;

export const isCognitoConfigured = Boolean(
  COGNITO.userPoolId && COGNITO.userPoolClientId
);
