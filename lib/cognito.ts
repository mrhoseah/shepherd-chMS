import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  AdminInitiateAuthCommand,
  AuthFlowType,
  GetUserCommand,
  SignUpCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  ConfirmSignUpCommand,
} from "@aws-sdk/client-cognito-identity-provider";
import { createHmac } from "crypto";

// Cognito configuration - read at runtime to ensure .env is loaded
function getCognitoConfig() {
  return {
    clientId: process.env.COGNITO_CLIENT_ID || "6qbvncedqjvi2jrpqhjj22ei7g",
    clientSecret: process.env.COGNITO_CLIENT_SECRET,
    userPoolId: process.env.COGNITO_USER_POOL_ID || "af-south-1_HZYIpahzs",
    region: process.env.COGNITO_REGION || "af-south-1",
  };
}

// Compute SECRET_HASH for Cognito authentication
// SECRET_HASH = HMAC-SHA256(USERNAME + CLIENT_ID, CLIENT_SECRET)
function computeSecretHash(username: string): string | undefined {
  const config = getCognitoConfig();
  if (!config.clientSecret) {
    return undefined;
  }
  return createHmac("sha256", config.clientSecret)
    .update(username + config.clientId)
    .digest("base64");
}

// Initialize Cognito client - lazy initialization to ensure env vars are loaded
// For public APIs (like InitiateAuth), credentials are NOT required
// Only needed for admin operations (AdminCreateUser, AdminSetUserPassword, etc.)
let cognitoClientInstance: CognitoIdentityProviderClient | null = null;

function getCognitoClient(requireCredentials: boolean = false): CognitoIdentityProviderClient {
  // Return existing instance if already created
  if (cognitoClientInstance) {
    return cognitoClientInstance;
  }

  const config = getCognitoConfig();
  
  // For public APIs (InitiateAuth, GetUser with access token), credentials are NOT needed
  // Only admin operations require AWS credentials
  if (requireCredentials) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    // Check if credentials are configured (only needed for admin operations)
    if (!accessKeyId || !secretAccessKey || 
        accessKeyId === "your-access-key" || 
        secretAccessKey === "your-secret-key") {
      throw new Error(
        "AWS credentials are required for admin operations. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file. Note: Regular user authentication does NOT require AWS credentials."
      );
    }

    // Create client with explicit credentials (for admin operations)
    cognitoClientInstance = new CognitoIdentityProviderClient({
      region: config.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  } else {
    // Create client for public APIs (InitiateAuth, GetUser with token)
    // Note: AWS SDK requires credentials to initialize, but we can use empty/anonymous credentials
    // The actual API calls (InitiateAuth) don't require AWS credentials - only the client initialization does
    // Try to use credentials if available, otherwise use anonymous credentials
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    
    if (accessKeyId && secretAccessKey && 
        accessKeyId !== "your-access-key" && 
        secretAccessKey !== "your-secret-key") {
      // Use credentials if available (better for SDK initialization)
      cognitoClientInstance = new CognitoIdentityProviderClient({
        region: config.region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
    } else {
      // No credentials - try with anonymous credentials
      // Note: This might not work with AWS SDK v3, but InitiateAuth is a public API
      // In practice, you'll need credentials for SDK initialization, but they're not used for the API call itself
      console.log("⚠️  No AWS credentials found. Public APIs (InitiateAuth) don't require AWS credentials, but SDK initialization might fail.");
      cognitoClientInstance = new CognitoIdentityProviderClient({
        region: config.region,
        // SDK will try to use default credential provider chain
      });
    }
  }

  return cognitoClientInstance;
}

// Export client for public APIs (no credentials needed)
// This is used for InitiateAuth, GetUser (with access token), etc.
export const cognitoClient = new Proxy({} as CognitoIdentityProviderClient, {
  get(_target, prop) {
    try {
      // Public APIs don't require credentials
      const client = getCognitoClient(false);
      const value = (client as any)[prop];
      if (typeof value === 'function') {
        return value.bind(client);
      }
      return value;
    } catch (error: any) {
      throw error;
    }
  },
});

// Export client for admin operations (requires credentials)
// This is used for AdminCreateUser, AdminSetUserPassword, etc.
export function getAdminCognitoClient(): CognitoIdentityProviderClient {
  return getCognitoClient(true);
}

// Sign in user with Cognito
export async function signInWithCognito(email: string, password: string) {
  try {
    const config = getCognitoConfig();
    
    // Try USER_PASSWORD_AUTH first (if enabled on client)
    // Fall back to ADMIN_NO_SRP_AUTH if USER_PASSWORD_AUTH is not enabled
    let response;
    let useAdminAuth = false;

    try {
      // First attempt: USER_PASSWORD_AUTH (requires flow to be enabled on client)
      const authParameters: Record<string, string> = {
        USERNAME: email,
        PASSWORD: password,
      };

      // Add SECRET_HASH if client secret is configured
      const secretHash = computeSecretHash(email);
      if (secretHash) {
        authParameters.SECRET_HASH = secretHash;
        console.log("✅ SECRET_HASH computed and added to auth parameters");
      }

      console.log("🔐 Attempting USER_PASSWORD_AUTH flow...");
      const command = new InitiateAuthCommand({
        AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
        ClientId: config.clientId,
        AuthParameters: authParameters,
      });

      response = await cognitoClient.send(command);
      console.log("✅ USER_PASSWORD_AUTH flow successful");
    } catch (error: any) {
      // Check if this is specifically the USER_PASSWORD_AUTH flow error
      const isUserPasswordAuthError = 
        error.message?.includes("USER_PASSWORD_AUTH flow not enabled") ||
        (error.name === "InvalidParameterException" && 
         error.message?.includes("USER_PASSWORD_AUTH"));
      
      if (isUserPasswordAuthError) {
        console.log("⚠️  USER_PASSWORD_AUTH not enabled, falling back to ADMIN_NO_SRP_AUTH...");
        useAdminAuth = true;
        
        try {
          // Use AdminInitiateAuthCommand (doesn't require flow to be enabled)
          // Still need SECRET_HASH if client has a secret
          const adminAuthParameters: Record<string, string> = {
            USERNAME: email,
            PASSWORD: password,
          };

          // Add SECRET_HASH if client secret is configured (required even for admin auth)
          const secretHash = computeSecretHash(email);
          if (secretHash) {
            adminAuthParameters.SECRET_HASH = secretHash;
            console.log("✅ SECRET_HASH computed and added to admin auth parameters");
          }

          const adminCommand = new AdminInitiateAuthCommand({
            UserPoolId: config.userPoolId,
            ClientId: config.clientId,
            AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
            AuthParameters: adminAuthParameters,
          });

          // Admin operations require credentials
          const adminClient = getAdminCognitoClient();
          response = await adminClient.send(adminCommand);
          console.log("✅ Using ADMIN_NO_SRP_AUTH flow (admin authentication)");
        } catch (adminError: any) {
          // If admin auth also fails, check the specific error
          console.error("❌ ADMIN_NO_SRP_AUTH also failed:");
          console.error("   Name:", adminError.name);
          console.error("   Message:", adminError.message);
          console.error("   Code:", adminError.code);
          
          // If it's also a flow not enabled error, provide clear instructions
          if (adminError.message?.includes("flow not enabled") || 
              adminError.name === "InvalidParameterException") {
            throw new Error(
              "No authentication flows are enabled for this Cognito app client. Please enable ALLOW_USER_PASSWORD_AUTH or ALLOW_ADMIN_USER_PASSWORD_AUTH in AWS Cognito Console → User Pool → App clients → Your app client → Authentication flows configuration."
            );
          }
          
          throw new Error(
            `Authentication failed. USER_PASSWORD_AUTH flow is not enabled, and ADMIN_NO_SRP_AUTH also failed: ${adminError.message || adminError.name}`
          );
        }
      } else {
        // Re-throw other errors immediately (don't try fallback)
        console.error("❌ USER_PASSWORD_AUTH error (not flow-related):", error.message);
        throw error;
      }
    }

    if (!response.AuthenticationResult?.AccessToken) {
      throw new Error("Authentication failed");
    }

    // Get user details
    const getUserCommand = new GetUserCommand({
      AccessToken: response.AuthenticationResult.AccessToken,
    });

    const userResponse = await cognitoClient.send(getUserCommand);

    return {
      accessToken: response.AuthenticationResult.AccessToken,
      idToken: response.AuthenticationResult.IdToken,
      refreshToken: response.AuthenticationResult.RefreshToken,
      userAttributes: userResponse.UserAttributes || [],
    };
  } catch (error: any) {
    console.error("❌ Cognito sign in error:");
    console.error("   Name:", error.name);
    console.error("   Message:", error.message);
    console.error("   Code:", error.code);
    console.error("   $metadata:", error.$metadata);
    
    // Check for AWS credential errors
    const errorMessage = error.message || "";
    const errorName = error.name || "";
    const errorCode = error.code || "";
    
    // AWS Credential Errors
    if (errorMessage.includes("InvalidClientTokenId") || 
        errorMessage.includes("SignatureDoesNotMatch") ||
        errorMessage.includes("InvalidAccessKeyId") ||
        errorMessage.includes("UnrecognizedClientException") ||
        errorMessage.includes("security token") ||
        errorMessage.includes("credentials") ||
        errorName === "UnrecognizedClientException" ||
        errorCode === "InvalidClientTokenId" ||
        errorCode === "SignatureDoesNotMatch") {
      const config = getCognitoConfig();
      const hasPlaceholderCredentials = 
        process.env.AWS_ACCESS_KEY_ID === "your-access-key" ||
        process.env.AWS_SECRET_ACCESS_KEY === "your-secret-key" ||
        !process.env.AWS_ACCESS_KEY_ID ||
        !process.env.AWS_SECRET_ACCESS_KEY;
      
      if (hasPlaceholderCredentials) {
        throw new Error("AWS credentials are not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in your .env file with real AWS credentials.");
      } else {
        throw new Error("Invalid AWS credentials. Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file.");
      }
    }
    
    // Resource Not Found Errors
    if (errorName === "ResourceNotFoundException" || 
        errorMessage.includes("does not exist") ||
        errorMessage.includes("User pool client")) {
      throw new Error(`Cognito resource not found: ${errorMessage}. Please check your COGNITO_USER_POOL_ID and COGNITO_CLIENT_ID in .env file.`);
    }
    
    // Not Authorized (wrong password)
    if (errorName === "NotAuthorizedException") {
      throw new Error("Invalid email or password");
    }
    
    // User Not Confirmed
    if (errorName === "UserNotConfirmedException") {
      throw new Error("Please contact administrator to activate your account");
    }
    
    // Invalid Parameter (could be flow not enabled or other issues)
    if (errorName === "InvalidParameterException") {
      if (errorMessage.includes("USER_PASSWORD_AUTH")) {
        throw new Error("USER_PASSWORD_AUTH flow is not enabled for this Cognito app client. Please enable it in AWS Cognito Console or contact your administrator.");
      }
      throw new Error(`Invalid parameter: ${errorMessage}`);
    }
    
    // Pass through the original error message
    throw new Error(error.message || `Authentication failed: ${errorName || "Unknown error"}`);
  }
}

// Get user attributes from Cognito token
export async function getUserFromToken(accessToken: string) {
  try {
    const command = new GetUserCommand({
      AccessToken: accessToken,
    });

    const response = await cognitoClient.send(command);
    
    const attributes: Record<string, string> = {};
    response.UserAttributes?.forEach((attr) => {
      if (attr.Name && attr.Value) {
        attributes[attr.Name] = attr.Value;
      }
    });

    return {
      sub: attributes.sub || "",
      email: attributes.email || "",
      emailVerified: attributes.email_verified === "true",
      phone: attributes.phone_number || attributes.phone || "",
      phoneVerified: attributes.phone_number_verified === "true",
      givenName: attributes.given_name || attributes["custom:firstName"] || "",
      familyName: attributes.family_name || attributes["custom:lastName"] || "",
      middleName: attributes.middle_name || "",
      picture: attributes.picture || "",
      customAttributes: attributes,
    };
  } catch (error: any) {
    console.error("Cognito get user error:", error);
    throw new Error("Failed to get user from token");
  }
}

// Sign up new user (self-registration)
export async function signUpWithCognito(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  middleName?: string,
  picture?: string
) {
  try {
    const attributes: Array<{ Name: string; Value: string }> = [
      { Name: "email", Value: email },
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
    ];

    if (phone) {
      attributes.push({ Name: "phone_number", Value: phone });
    }
    if (middleName) {
      attributes.push({ Name: "middle_name", Value: middleName });
    }
    if (picture) {
      attributes.push({ Name: "picture", Value: picture });
    }

    const config = getCognitoConfig();
    const signUpParams: any = {
      ClientId: config.clientId,
      Username: email, // Using email as username
      Password: password,
      UserAttributes: attributes,
    };

    // Add SECRET_HASH if client secret is configured
    const secretHash = computeSecretHash(email);
    if (secretHash) {
      signUpParams.SecretHash = secretHash;
    }

    const command = new SignUpCommand(signUpParams);

    const response = await cognitoClient.send(command);
    return {
      success: true,
      userSub: response.UserSub,
      codeDeliveryDetails: response.CodeDeliveryDetails,
    };
  } catch (error: any) {
    console.error("Cognito sign up error:", error);
    throw new Error(error.message || "Failed to sign up");
  }
}

// Confirm sign up (if email/phone verification is required)
export async function confirmSignUp(email: string, confirmationCode: string) {
  try {
    const config = getCognitoConfig();
    const confirmParams: any = {
      ClientId: config.clientId,
      Username: email,
      ConfirmationCode: confirmationCode,
    };

    // Add SECRET_HASH if client secret is configured
    const secretHash = computeSecretHash(email);
    if (secretHash) {
      confirmParams.SecretHash = secretHash;
    }

    const command = new ConfirmSignUpCommand(confirmParams);

    await cognitoClient.send(command);
    return { success: true };
  } catch (error: any) {
    console.error("Cognito confirm sign up error:", error);
    throw new Error(error.message || "Failed to confirm sign up");
  }
}

// Create user in Cognito (for admin use)
export async function createCognitoUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  phone?: string,
  middleName?: string,
  picture?: string
) {
  try {
    const attributes: Array<{ Name: string; Value: string }> = [
      { Name: "email", Value: email },
      { Name: "email_verified", Value: "true" },
      { Name: "given_name", Value: firstName },
      { Name: "family_name", Value: lastName },
    ];

    if (phone) {
      attributes.push({ Name: "phone_number", Value: phone });
      attributes.push({ Name: "phone_number_verified", Value: "true" });
    }
    if (middleName) {
      attributes.push({ Name: "middle_name", Value: middleName });
    }
    if (picture) {
      attributes.push({ Name: "picture", Value: picture });
    }

    const config = getCognitoConfig();
    // Admin operations require credentials
    const adminClient = getAdminCognitoClient();
    
    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: config.userPoolId,
      Username: email,
      UserAttributes: attributes,
      MessageAction: "SUPPRESS", // Don't send welcome email
      TemporaryPassword: password,
    });

    await adminClient.send(createUserCommand);

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: config.userPoolId,
      Username: email,
      Password: password,
      Permanent: true,
    });

    await adminClient.send(setPasswordCommand);

    return { success: true };
  } catch (error: any) {
    console.error("Cognito create user error:", error);
    
    // Check for specific Cognito error codes
    if (error.name === "UsernameExistsException" || error.__type === "UsernameExistsException") {
      const cognitoError = new Error("User already exists in Cognito");
      (cognitoError as any).name = "UsernameExistsException";
      throw cognitoError;
    }
    
    throw new Error(error.message || "Failed to create user in Cognito");
  }
}

