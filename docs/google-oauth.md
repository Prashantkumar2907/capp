# Google OAuth Setup

## Google Cloud

1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs & Services > OAuth consent screen.
4. Configure app name, support email, and developer contact.
5. Go to Credentials > Create Credentials > OAuth client ID.
6. Choose Web application.
7. Add authorized redirect URI:

```text
https://YOUR_SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
```

## Supabase

1. Open Supabase Dashboard > Authentication > Providers.
2. Enable Google.
3. Paste Google Client ID and Client Secret.
4. Open Authentication > URL Configuration.
5. Add local and production redirect URLs:

```text
http://localhost:3000/auth/callback
https://your-domain.com/auth/callback
```

## App

The app already has `/auth/callback`. Add a Google sign-in button by calling:

```ts
await supabase.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: `${location.origin}/auth/callback` },
});
```
