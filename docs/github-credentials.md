# Getting GitHub OAuth Credentials

To enable GitHub login for Sign in with Ethos, you need to create a GitHub OAuth App.

## Steps

1.  **Log in to GitHub**: Go to [github.com](https://github.com) and sign in.
2.  **Go to Settings**:
    - Click your profile picture in the top-right corner.
    - Select **Settings**.
3.  **Developer Settings**:
    - Scroll down to the bottom of the left sidebar.
    - Click **Developer settings**.
4.  **OAuth Apps**:
    - Click **OAuth Apps** in the sidebar.
    - Click the **New OAuth App** button (top right).
5.  **Register a new application**:
    - **Application Name**: Enter a name (e.g., "Sign in with Ethos").
    - **Homepage URL**: Enter your application's homepage URL (e.g., `http://localhost:3000` for development).
    - **Authorization callback URL**: Enter the redirect URI.
        - For local development, this is typically `http://localhost:3000/api/auth/callback/github` (check your app's route).
    - Click **Register application**.
6.  **Get Client ID and Secret**:
    - You will see the **Client ID** on the next page. Copy it.
    - Click **Generate a new client secret**. Copy it immediately (you won't see it again).

## Configuration

Add these credentials to your environment variables:

```env
GITHUB_CLIENT_ID=your_client_id_here
GITHUB_CLIENT_SECRET=your_client_secret_here
```
