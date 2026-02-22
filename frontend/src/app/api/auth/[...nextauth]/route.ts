import NextAuth, { NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const authOptions: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: process.env.KEYCLOAK_ID!,
      clientSecret: process.env.KEYCLOAK_SECRET || "",
      // Must match the 'iss' claim in JWT tokens issued by Keycloak.
      // For HAProxy deployments: set KEYCLOAK_ISSUER to the external HTTPS URL so that
      // OIDC discovery returns the correct issuer (matching what Keycloak puts in tokens).
      issuer: process.env.KEYCLOAK_ISSUER!,
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
