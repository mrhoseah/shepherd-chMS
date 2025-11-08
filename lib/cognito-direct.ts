import { createHmac } from "crypto";
import { logError } from "./error-logger";

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
function computeSecretHash(username: string): string | undefined {
  const config = getCognitoConfig();
  if (!config.clientSecret) {
    return undefined;
  }
  return createHmac("sha256", config.clientSecret)
    .update(username + config.clientId)
    .digest("base64");
}

// Direct HTTP call to Cognito InitiateAuth endpoint (no AWS SDK, no credentials needed)
export async function signInWithCognitoDirect(email: string, password: string) {
  console.log("🌐 signInWithCognitoDirect() called");
  console.log("   Email:", email);
  console.log("   Password length:", password?.length || 0);
  
  const config = getCognitoConfig();
  const region = config.region;
  
  console.log("   Config:", {
    clientId: config.clientId,
    userPoolId: config.userPoolId,
    region: region,
    hasClientSecret: !!config.clientSecret,
  });
  
  // Cognito API endpoint
  const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;
  console.log("   Endpoint:", endpoint);
  
  const authParameters: Record<string, string> = {
    USERNAME: email,
    PASSWORD: password,
  };

  // Add SECRET_HASH if client secret is configured
  const secretHash = computeSecretHash(email);
  if (secretHash) {
    authParameters.SECRET_HASH = secretHash;
    console.log("   SECRET_HASH: computed and added");
  } else {
    console.log("   SECRET_HASH: not needed (no client secret)");
  }

  const requestBody = {
    AuthFlow: "USER_PASSWORD_AUTH",
    ClientId: config.clientId,
    AuthParameters: authParameters,
  };

  console.log("📤 Making HTTP request to Cognito...");
  console.log("   Request body:", JSON.stringify({
    ...requestBody,
    AuthParameters: {
      ...requestBody.AuthParameters,
      PASSWORD: "***",
    },
  }, null, 2));

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-Amz-Target": "AWSCognitoIdentityProviderService.InitiateAuth",
        "Content-Type": "application/x-amz-json-1.1",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("📥 Response received");
    console.log("   Status:", response.status, response.statusText);
    
    const data = await response.json();
    console.log("   Response data:", JSON.stringify({
      __type: data.__type,
      message: data.message,
      hasAuthenticationResult: !!data.AuthenticationResult,
    }, null, 2));

    if (!response.ok) {
      const errorName = data.__type || "UnknownError";
      const errorMessage = data.message || "Authentication failed";
      
      console.error("❌ Cognito API error:");
      console.error("   Status:", response.status);
      console.error("   Error type:", errorName);
      console.error("   Error message:", errorMessage);
      console.error("   Full response:", JSON.stringify(data, null, 2));
      
      // Log to JSON file
      const apiError = new Error(errorMessage);
      (apiError as any).name = errorName;
      (apiError as any).code = response.status.toString();
      logError("CognitoDirect_API_Error", apiError, {
        endpoint,
        clientId: config.clientId,
        userPoolId: config.userPoolId,
        region: config.region,
        hasClientSecret: !!config.clientSecret,
        fullResponse: data,
        requestBody: {
          AuthFlow: "USER_PASSWORD_AUTH",
          ClientId: config.clientId,
          AuthParameters: {
            USERNAME: email,
            PASSWORD: "***",
            ...(secretHash ? { SECRET_HASH: "***" } : {}),
          },
        },
      });
      
      // Handle specific errors - check errorName first (more reliable)
      if (errorName === "InvalidParameterException") {
        if (errorMessage.includes("USER_PASSWORD_AUTH flow not enabled") || 
            errorMessage.includes("flow not enabled")) {
          throw new Error(
            `USER_PASSWORD_AUTH flow is not enabled. Go to AWS Cognito Console → User Pool (${config.userPoolId}) → App integration → App clients → Client ID ${config.clientId} → Edit → Enable "ALLOW_USER_PASSWORD_AUTH" under Authentication flows configuration.`
          );
        }
        // Other InvalidParameterException errors
        throw new Error(`Invalid parameter: ${errorMessage}`);
      }
      
      if (errorName === "NotAuthorizedException") {
        throw new Error("Invalid email or password");
      }
      
      if (errorName === "UserNotConfirmedException") {
        throw new Error("Please contact administrator to activate your account");
      }
      
      if (errorName === "ResourceNotFoundException") {
        throw new Error(`Cognito resource not found: ${errorMessage}`);
      }
      
      if (errorName === "UnrecognizedClientException") {
        throw new Error(`Invalid Cognito client configuration: ${errorMessage}. Please check your COGNITO_CLIENT_ID and COGNITO_CLIENT_SECRET.`);
      }
      
      // For any other error, throw the exact message from Cognito
      throw new Error(errorMessage);
    }
    
    console.log("✅ Cognito API call successful");

    if (!data.AuthenticationResult?.AccessToken) {
      throw new Error("Authentication failed - no access token received");
    }

    return {
      accessToken: data.AuthenticationResult.AccessToken,
      idToken: data.AuthenticationResult.IdToken,
      refreshToken: data.AuthenticationResult.RefreshToken,
    };
  } catch (error: any) {
    console.error("❌ Direct Cognito authentication error:", error);
    
    // Log to JSON file
    logError("CognitoDirect_Exception", error, {
      email,
      endpoint,
      clientId: config.clientId,
      userPoolId: config.userPoolId,
      region: config.region,
    });
    
    throw error;
  }
}

// Get user attributes using access token (direct HTTP call)
export async function getUserFromTokenDirect(accessToken: string) {
  const config = getCognitoConfig();
  const region = config.region;
  const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser",
        "Content-Type": "application/x-amz-json-1.1",
      },
      body: JSON.stringify({
        AccessToken: accessToken,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorName = data.__type || "UnknownError";
      const errorMessage = data.message || "Failed to get user from token";
      
      // Handle specific errors
      if (errorName === "NotAuthorizedException" || errorMessage.includes("Invalid token") || errorMessage.includes("expired")) {
        throw new Error("Authentication token is invalid or expired. Please sign in again.");
      }
      
      throw new Error(errorMessage);
    }

    const attributes: Record<string, string> = {};
    data.UserAttributes?.forEach((attr: any) => {
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
    // If it's already an Error with a message, preserve it
    if (error instanceof Error && error.message) {
      throw error;
    }
    // Otherwise, create a new error with the original message
    throw new Error(error.message || "Failed to get user from token");
  }
}

