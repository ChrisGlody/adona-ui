/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "adona-ui",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: {
        aws: {
          profile: "adona-sst-profile",
          region: "us-east-1",
        },
      },
    };
  },
  async run() {
    // Cognito for auth — same config as adona-sst (usernames: ["email"])
    const userPool = new sst.aws.CognitoUserPool("UserPool", {
      usernames: ["email"],
    });
    const webClient = userPool.addClient("Web");

    const site = new sst.aws.Nextjs("AdonaUI", {
      path: ".",
      link: [userPool, webClient],
      environment: {
        NEXT_PUBLIC_USER_POOL_ID: userPool.id,
        NEXT_PUBLIC_USER_POOL_CLIENT_ID: webClient.id,
        NEXT_PUBLIC_AWS_REGION: $app.providers?.aws.region,
        DATABASE_URL: process.env.DATABASE_URL!,
        OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
        QDRANT_URL: process.env.QDRANT_URL ?? "",
        QDRANT_API_KEY: process.env.QDRANT_API_KEY ?? "",
        HYBRID_SEARCH_API_URL:
          process.env.HYBRID_SEARCH_API_URL ??
          "http://hybrid-publi-rrdjedjmqwu6-1689535120.us-east-1.elb.amazonaws.com",
        INTERNAL_API_BASE_URL: process.env.INTERNAL_API_BASE_URL ?? "",
      },
    });
  },
});
