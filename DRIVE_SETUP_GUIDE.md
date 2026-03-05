# Google Drive API Setup Guide

To allow your web app (Soul of Medico) to securely fetch and upload files to Google Drive, you need to configure OAuth 2.0 Credentials. 

Please follow these exact steps to get your Client ID, Client Secret, and Refresh Token.

## Step 1: Enable Google Drive API Next
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (e.g., "Soul of Medico Drive API").
3. Go to **APIs & Services > Library**.
4. Search for **Google Drive API** and click **Enable**.

## Step 2: Configure OAuth Consent Screen
1. Go to **APIs & Services > OAuth consent screen**.
2. Select **External** and click **Create**.
3. Fill in the required fields (App name, User support email, Developer contact information) and click **Save and Continue**.
4. On the **Scopes** page, click **Add or Remove Scopes**, find `.../auth/drive` (Google Drive API), check the box, and click **Update**. Then click **Save and Continue**.
5. Add your own Google email address under **Test users** and click **Save**.

## Step 3: Create OAuth 2.0 Client ID
1. Go to **APIs & Services > Credentials**.
2. Click **Create Credentials** > **OAuth client ID**.
3. For Application type, select **Web application**.
4. Name it something like "OAuth Playground".
5. Under **Authorized redirect URIs**, add `https://developers.google.com/oauthplayground`.
6. Click **Create**.
7. **Copy Your Client ID and Client Secret.** Keep this window open or save them somewhere securely.

## Step 4: Generate Refresh Token
1. Go to the [Google Developers OAuth 2.0 Playground](https://developers.google.com/oauthplayground/).
2. Click the gear icon :gear: in the top right.
3. Check **"Use your own OAuth credentials"**.
4. Paste your **Client ID** and **Client Secret** into the fields.
5. Close the gear menu.
6. In **Step 1 (Select & authorize APIs)**, scroll down to **Drive API v3** and select `https://www.googleapis.com/auth/drive`.
7. Click **Authorize APIs** and log in with the Google Account you added to "Test users".
8. In **Step 2 (Exchange authorization code for tokens)**, click **Exchange authorization code for tokens**.
9. **Copy your Refresh Token.**

## Step 5: Configure Your Project
1. In the `functions` folder of your project, rename `.env.example` to `.env` (or create a new `.env` file).
2. Open the `.env` file and paste in your credentials:

```env
DRIVE_CLIENT_ID="your_client_id_here"
DRIVE_CLIENT_SECRET="your_client_secret_here"
DRIVE_REFRESH_TOKEN="your_refresh_token_here"
DRIVE_REDIRECT_URI="https://developers.google.com/oauthplayground"
```

3. Deploy your updated functions by running the following command in your terminal from the root folder (`c:\Users\praveen\Desktop\web site\soul-of-medico`):
```bash
firebase deploy --only functions
```

Your app will now be able to fetch files from Google Drive!
