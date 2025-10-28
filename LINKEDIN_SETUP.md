# LinkedIn Integration Setup

## Required Environment Variables

Add these to your `.env.local` file and Vercel environment variables:

```bash
# LinkedIn OAuth Credentials
LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=https://www.seodonscrm.co.uk/api/linkedin/callback

# For local development:
# NEXT_PUBLIC_LINKEDIN_REDIRECT_URI=http://localhost:3000/api/linkedin/callback
```

## How to Get LinkedIn Credentials

1. **Go to LinkedIn Developers**
   - Visit: https://www.linkedin.com/developers/apps
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click "Create app"
   - Fill in:
     - App name: "SEO Dons CRM"
     - LinkedIn Page: Select your company page
     - Privacy policy URL: Your privacy policy
     - App logo: Upload your logo

3. **Get Your Credentials**
   - Go to the "Auth" tab
   - Copy the **Client ID** → Use as `LINKEDIN_CLIENT_ID`
   - Copy the **Client Secret** → Use as `LINKEDIN_CLIENT_SECRET`

4. **Add Redirect URL**
   - In the "Auth" tab, under "OAuth 2.0 settings"
   - Add redirect URL: `https://www.seodonscrm.co.uk/api/linkedin/callback`
   - For local dev, also add: `http://localhost:3000/api/linkedin/callback`

5. **Request Permissions**
   - In the "Products" tab, add:
     - **Sign In with LinkedIn using OpenID Connect** (for authentication)
     - **Share on LinkedIn** (for posting)
   - Wait for approval (usually instant for Sign In, may take time for Share)

6. **OAuth 2.0 Scopes**
   - Your app needs these scopes:
     - `openid` - For authentication
     - `profile` - For user profile
     - `email` - For user email
     - `w_member_social` - For posting on behalf of user

## Vercel Setup

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the three variables above
4. Redeploy your application

## Testing

1. After adding environment variables and deploying
2. Go to `/dashboard/social`
3. Click "Connect LinkedIn"
4. You should be redirected to LinkedIn OAuth
5. After approving, you'll be redirected back with a connected account

## Features

### Admin Capabilities
- Create post templates with text, images, and videos
- Organize templates by category (Industry News, Company Updates, etc.)
- Tag templates for easy filtering
- View template usage analytics
- Activate/deactivate templates

### SDR Capabilities
- Browse template library
- Filter templates by category and tags
- Preview templates before posting
- Customize template content before posting
- Post directly to LinkedIn
- View posting history and engagement stats

## Troubleshooting

### Error: "Missing LinkedIn environment variables"
- Ensure all three variables are set in Vercel
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Error: "redirect_uri_mismatch"
- Ensure redirect URI in LinkedIn app settings matches exactly
- Use HTTPS in production (not HTTP)
- No trailing slashes

### Error: "Application does not have access to this product"
- Request "Share on LinkedIn" product in LinkedIn Developer Portal
- Wait for approval (check email)
- May require company page verification

## Database Tables

Migration 022 creates these tables:

1. **linkedin_post_templates**
   - Admin-created templates
   - Includes title, content, media, category, tags
   - Tracks usage count automatically

2. **linkedin_posts**
   - SDR post history
   - Links to optional template
   - Tracks status (draft/scheduled/published/failed)
   - Stores engagement metrics (likes, comments, shares)

## API Endpoints

- `POST /api/linkedin/templates` - Create/update template (admin only)
- `GET /api/linkedin/templates` - List templates
- `POST /api/linkedin/post` - Publish to LinkedIn
- `GET /api/linkedin/posts` - Get user's post history
