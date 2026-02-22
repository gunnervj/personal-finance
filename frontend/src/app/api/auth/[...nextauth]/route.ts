import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

// KEYCLOAK_ISSUER      = external URL (localhost:8080) — used by the browser for authorization redirect
//                        and for 'iss' claim validation in JWT tokens.
// KEYCLOAK_INTERNAL_ISSUER = internal Docker URL (keycloak:8080) — used by Next.js server-side for
//                        OIDC discovery and token exchange (unreachable from browser).
const externalIssuer = process.env.KEYCLOAK_ISSUER!;
const internalIssuer = process.env.KEYCLOAK_INTERNAL_ISSUER || externalIssuer;

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET || "",
      // issuer is used to validate the 'iss' claim in JWT tokens.
      // Must match what Keycloak puts in tokens (set KC_HOSTNAME=localhost so tokens use localhost URL).
      issuer: externalIssuer,
      // Override well-known to use internal Docker hostname for server-side discovery.
      // Keycloak (with KC_HOSTNAME=localhost) returns localhost URLs in this document,
      // so the authorization_endpoint will correctly point to localhost for browser redirects.
      wellKnown: `${internalIssuer}/.well-known/openid-configuration`,
      // Override token endpoint to use internal Docker hostname for server-side code exchange.
      token: `${internalIssuer}/protocol/openid-connect/token`,
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.idToken = token.idToken as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  events: {
    async signOut({ token }) {
      if (token?.idToken) {
        try {
          // Use internal URL for logout to avoid external DNS resolution inside Docker
          const issuerUrl = process.env.KEYCLOAK_INTERNAL_ISSUER || process.env.KEYCLOAK_ISSUER!;
          const logoutUrl = `${issuerUrl}/protocol/openid-connect/logout`;
          await fetch(logoutUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              id_token_hint: token.idToken as string,
              client_id: process.env.KEYCLOAK_ID!,
            }),
          });
        } catch (error) {
          console.error("Error during Keycloak logout:", error);
        }
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
