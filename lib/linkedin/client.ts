// LinkedIn OAuth and API client

export const linkedInConfig = {
  clientId: process.env.LINKEDIN_CLIENT_ID!,
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
  redirectUri: process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI!,
  scope: 'openid profile email w_member_social', // Permissions needed
};

// Validate configuration
export function validateLinkedInConfig() {
  const missing: string[] = [];

  if (!process.env.LINKEDIN_CLIENT_ID) missing.push('LINKEDIN_CLIENT_ID');
  if (!process.env.LINKEDIN_CLIENT_SECRET) missing.push('LINKEDIN_CLIENT_SECRET');
  if (!process.env.NEXT_PUBLIC_LINKEDIN_REDIRECT_URI) missing.push('NEXT_PUBLIC_LINKEDIN_REDIRECT_URI');

  if (missing.length > 0) {
    throw new Error(`Missing LinkedIn environment variables: ${missing.join(', ')}`);
  }
}

// Generate OAuth authorization URL
export function getAuthorizationUrl(state: string): string {
  validateLinkedInConfig();

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: linkedInConfig.clientId,
    redirect_uri: linkedInConfig.redirectUri,
    state,
    scope: linkedInConfig.scope,
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params.toString()}`;
}

// Exchange authorization code for access token
export async function getAccessToken(code: string) {
  validateLinkedInConfig();

  const response = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: linkedInConfig.clientId,
      client_secret: linkedInConfig.clientSecret,
      redirect_uri: linkedInConfig.redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json();
  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in, // seconds
    refreshToken: data.refresh_token,
    refreshTokenExpiresIn: data.refresh_token_expires_in,
  };
}

// Get LinkedIn user profile
export async function getUserProfile(accessToken: string) {
  const response = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get user profile: ${error}`);
  }

  return await response.json();
}

// Create a text post on LinkedIn
export interface CreatePostParams {
  accessToken: string;
  linkedInUserId: string;
  text: string;
  visibility?: 'PUBLIC' | 'CONNECTIONS' | 'LOGGED_IN';
}

export async function createPost(params: CreatePostParams) {
  const { accessToken, linkedInUserId, text, visibility = 'PUBLIC' } = params;

  const postData = {
    author: `urn:li:person:${linkedInUserId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text,
        },
        shareMediaCategory: 'NONE',
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create post: ${error}`);
  }

  const data = await response.json();
  return {
    postId: data.id,
    postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
  };
}

// Create a post with image
export interface CreatePostWithImageParams extends CreatePostParams {
  imageUrl: string;
  imageDescription?: string;
}

export async function createPostWithImage(params: CreatePostWithImageParams) {
  const { accessToken, linkedInUserId, text, imageUrl, imageDescription, visibility = 'PUBLIC' } = params;

  // Step 1: Register image upload
  const registerResponse = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${linkedInUserId}`,
        serviceRelationships: [
          {
            relationshipType: 'OWNER',
            identifier: 'urn:li:userGeneratedContent',
          },
        ],
      },
    }),
  });

  if (!registerResponse.ok) {
    throw new Error('Failed to register image upload');
  }

  const registerData = await registerResponse.json();
  const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Upload image
  const imageResponse = await fetch(imageUrl);
  const imageBlob = await imageResponse.blob();

  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    body: imageBlob,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload image');
  }

  // Step 3: Create post with image
  const postData = {
    author: `urn:li:person:${linkedInUserId}`,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text,
        },
        shareMediaCategory: 'IMAGE',
        media: [
          {
            status: 'READY',
            description: {
              text: imageDescription || '',
            },
            media: asset,
            title: {
              text: 'Image',
            },
          },
        ],
      },
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': visibility,
    },
  };

  const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create post with image: ${error}`);
  }

  const data = await response.json();
  return {
    postId: data.id,
    postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
  };
}

// Get post analytics
export async function getPostAnalytics(accessToken: string, postId: string) {
  const response = await fetch(
    `https://api.linkedin.com/v2/socialActions/${postId}/(likes,comments)`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'X-Restli-Protocol-Version': '2.0.0',
      },
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get post analytics: ${error}`);
  }

  return await response.json();
}
