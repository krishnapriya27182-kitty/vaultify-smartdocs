# Custom Domain Setup

Instructions for pointing a custom domain to your Vaultify SmartDocs deployment on Render.

## 1. Add the domain in Render

1. Open your service in the [Render dashboard](https://dashboard.render.com).
2. Go to **Settings → Custom Domains**.
3. Click **Add Custom Domain** and enter your domain (e.g. `app.yourdomain.com`).
4. Render will show you a CNAME target — copy it.

## 2. Create a CNAME record with your DNS provider

| Type  | Name / Host          | Value (target)                  | TTL  |
|-------|----------------------|---------------------------------|------|
| CNAME | `app` (or `@`)       | `<your-service>.onrender.com`   | 3600 |

> For a root/apex domain (`@`) some providers require an ALIAS or ANAME record instead of CNAME.

## 3. Wait for propagation

DNS changes typically propagate within a few minutes to a few hours.
You can check status with:

```bash
dig app.yourdomain.com
```

## 4. SSL

Render provisions a free TLS certificate automatically once the CNAME resolves.
No extra steps needed.

## Environment variable reminder

If your app constructs absolute URLs (e.g. for password reset emails), update the
`APP_URL` environment variable in Render to match your custom domain:

```
APP_URL=https://app.yourdomain.com
```
