import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import { signInWithCognitoDirect, getUserFromTokenDirect } from "./cognito-direct";
import { logError } from "./error-logger";

/**
 * Validates that all required Cognito environment variables are set
 */
function validateCognitoConfig(): void {
  const required = ["COGNITO_USER_POOL_ID", "COGNITO_CLIENT_ID", "COGNITO_REGION"];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Cognito environment variables: ${missing.join(", ")}`
    );
  }
}

// Validate configuration on module load (server-side only)
if (typeof window === "undefined") {
  try {
    validateCognitoConfig();
    console.log("✅ Cognito configuration validated");
  } catch (error: any) {
    console.error("❌ Cognito configuration error:", error.message);
  }
}

/**
 * NextAuth configuration
 * Uses AWS Cognito for authentication via direct HTTP calls (no AWS SDK credentials needed)
 */
export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    CredentialsProvider({
      id: "cognito",
      name: "Cognito",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Step 1: Authenticate with Cognito
          const cognitoResponse = await signInWithCognitoDirect(
            credentials.email,
            credentials.password
          );

          if (!cognitoResponse?.accessToken) {
            throw new Error("Cognito authentication failed: No access token received");
          }

          // Step 2: Get user attributes from Cognito
          const cognitoUser = await getUserFromTokenDirect(cognitoResponse.accessToken);

          if (!cognitoUser?.email) {
            throw new Error("Failed to retrieve user information from Cognito");
          }

          // Step 3: Find or create user in database
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              email: true,
              phone: true,
              firstName: true,
              lastName: true,
              middleName: true,
              profileImage: true,
              role: true,
              status: true,
              canLogin: true,
              emailVerified: true,
              phoneVerified: true,
            },
          });

          if (!user) {
            // Create new user
            user = await prisma.user.create({
              data: {
                email: cognitoUser.email,
                phone: cognitoUser.phone || null,
                firstName: cognitoUser.givenName || "User",
                middleName: cognitoUser.middleName || null,
                lastName: cognitoUser.familyName || "",
                profileImage: cognitoUser.picture || null,
                role: "GUEST",
                status: "ACTIVE",
                canLogin: false,
                emailVerified: cognitoUser.emailVerified,
                phoneVerified: cognitoUser.phoneVerified,
              },
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                middleName: true,
                profileImage: true,
                role: true,
                status: true,
                canLogin: true,
                emailVerified: true,
                phoneVerified: true,
              },
            });
          } else {
            // Update existing user with Cognito data
            const updateData: {
              emailVerified: boolean;
              phoneVerified: boolean;
              phone?: string;
              firstName?: string;
              lastName?: string;
              middleName?: string;
              profileImage?: string;
            } = {
              emailVerified: cognitoUser.emailVerified,
              phoneVerified: cognitoUser.phoneVerified,
            };

            if (cognitoUser.phone && cognitoUser.phone !== user.phone) {
              updateData.phone = cognitoUser.phone;
            }
            if (cognitoUser.givenName && cognitoUser.givenName !== user.firstName) {
              updateData.firstName = cognitoUser.givenName;
            }
            if (cognitoUser.familyName && cognitoUser.familyName !== user.lastName) {
              updateData.lastName = cognitoUser.familyName;
            }
            if (cognitoUser.middleName && cognitoUser.middleName !== user.middleName) {
              updateData.middleName = cognitoUser.middleName;
            }
            if (cognitoUser.picture && cognitoUser.picture !== user.profileImage) {
              updateData.profileImage = cognitoUser.picture;
            }

            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData,
              select: {
                id: true,
                email: true,
                phone: true,
                firstName: true,
                lastName: true,
                middleName: true,
                profileImage: true,
                role: true,
                status: true,
                canLogin: true,
                emailVerified: true,
                phoneVerified: true,
              },
            });
          }

          // Step 4: Check login permissions
          // Roles that cannot sign in (for grouping/identification only)
          const nonLoginRoles = ["PROTOCOL", "GUEST"];
          const isNonLoginRole = nonLoginRoles.includes(user.role);
          
          if (isNonLoginRole) {
            throw new Error(
              "This role does not have login access. This role is for identification and grouping purposes only."
            );
          }

          const isAdmin = user.role === "ADMIN";
          const canLogin = isAdmin || (user.canLogin && user.status === "ACTIVE");

          if (!canLogin) {
            if (!isAdmin && !user.canLogin) {
              throw new Error(
                "You do not have permission to access the dashboard. Please contact an administrator."
              );
            }
            if (user.status !== "ACTIVE") {
              throw new Error(
                `Your account is ${user.status.toLowerCase()}. Please contact an administrator.`
              );
            }
            throw new Error("You do not have permission to access the dashboard");
          }

          // Step 5: Return user object for NextAuth
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`.trim() || user.email,
            image: user.profileImage || undefined,
            role: user.role,
            accessToken: cognitoResponse.accessToken,
            idToken: cognitoResponse.idToken,
            refreshToken: cognitoResponse.refreshToken,
          };
        } catch (error: any) {
          // Log error for debugging
          logError("NextAuth_Authorize_Error", error, {
            email: credentials.email,
            cognitoConfig: {
              userPoolId: process.env.COGNITO_USER_POOL_ID,
              clientId: process.env.COGNITO_CLIENT_ID,
              region: process.env.COGNITO_REGION,
            },
          });

          // Throw error with original message from Cognito
          const errorMessage = error.message || "Authentication failed";
          const authError = new Error(errorMessage) as Error & {
            code?: string;
            name?: string;
          };
          authError.code = error.code || error.name;
          authError.name = error.name || "AuthenticationError";
          throw authError;
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Validate user object
      if (!user?.id || !user?.email) {
        return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Initial sign in - add user data to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.picture = user.image;
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
        token.idToken = (user as any).idToken;
        token.refreshToken = (user as any).refreshToken;
      }
      return token;
    },
    async session({ session, token }) {
      // Add user data from token to session
      if (token.id) {
        session.user.id = token.id;
      }
      if (token.email) {
        session.user.email = token.email;
      }
      if (token.name) {
        session.user.name = token.name;
      }
      if (token.picture) {
        session.user.image = token.picture;
      }
      if (token.role) {
        session.user.role = token.role;
      }
      if (token.accessToken) {
        session.accessToken = token.accessToken;
      }
      if (token.idToken) {
        session.idToken = token.idToken;
      }
      if (token.refreshToken) {
        session.refreshToken = token.refreshToken;
      }
      return session;
    },
  },
};
