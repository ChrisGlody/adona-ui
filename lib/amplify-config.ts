import { Amplify } from "aws-amplify";
import { COGNITO, isCognitoConfigured } from "./cognito-config";

// Same Amplify config as adona-sst lib/amplify-config.ts (env from sst.config.ts site.environment)
if (typeof window !== "undefined" && isCognitoConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: COGNITO.userPoolId as string,
        userPoolClientId: COGNITO.userPoolClientId as string,
      },
    },
  });
}

export { isCognitoConfigured };
