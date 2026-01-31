import { jwtVerify, createRemoteJWKSet } from "jose";
import { getTokenFromCookie } from "./cookies";
import { COGNITO } from "./cognito-config";

/** Mock user id used when auth-token cookie is set (mocked login). */
export const MOCK_USER_ID = "mock-user-id";
export const MOCK_USER_EMAIL = "mock@example.com";

/** Mock token value we set on login; any auth-token equal to this is treated as mock. */
export const MOCK_AUTH_TOKEN = "mock-auth-token";

export interface AuthUser {
  sub: string;
  email?: string;
  "cognito:username"?: string;
  [key: string]: unknown;
}

function getMockUser(): AuthUser {
  return {
    sub: MOCK_USER_ID,
    email: MOCK_USER_EMAIL,
    "cognito:username": MOCK_USER_EMAIL,
  };
}

async function verifyCognitoJwt(token: string): Promise<AuthUser | null> {
  const { region, userPoolId } = COGNITO;
  if (!userPoolId) return null;
  try {
    const url = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}/.well-known/jwks.json`;
    const jwks = createRemoteJWKSet(new URL(url));
    const { payload } = await jwtVerify(token, jwks);
    return payload as AuthUser;
  } catch {
    return null;
  }
}

export async function getAuthUserFromRequest(request: Request): Promise<AuthUser | null> {
  const authHeader = request.headers.get("Authorization");
  let token = authHeader?.replace("Bearer ", "") ?? null;
  if (!token) {
    token = await getTokenFromCookie();
  }
  if (!token) return null;
  if (token === MOCK_AUTH_TOKEN) return getMockUser();
  const cognitoUser = await verifyCognitoJwt(token);
  return cognitoUser ?? null;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const token = await getTokenFromCookie();
  if (!token) return null;
  if (token === MOCK_AUTH_TOKEN) return getMockUser();
  const cognitoUser = await verifyCognitoJwt(token);
  return cognitoUser ?? null;
}

export async function requireAuth(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
