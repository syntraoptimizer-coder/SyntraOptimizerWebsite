# Syntra Optimizer

React 19 + TypeScript + Vinext/Vite. English marketing website inspired by the supplied Cloudlight reference. The supplied Syntra logo is used unchanged. Responsive layout, light/dark theme, interactive demo, profiles, comparisons, FAQ, Free and Premium pricing.

## Local development

Install with npm ci, then npm run dev. The local URL is http://localhost:5173. Production build: npm run build.

## Product configuration

Edit lib/product.ts to set the official download and checkout URLs when available. Free costs $0; Premium costs $15. The billing period has deliberately not been assumed. The planned feature descriptions should be confirmed against the actual optimizer before launch. Browser previews are illustrative and never access the visitor's operating system.

## Supabase connection

1. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY to .env.local. Only a public publishable key belongs in client configuration. Never use a service-role key here.
2. Apply supabase/migrations/001_licenses.sql in your project's SQL editor after reviewing it. The migration creates a license for each user and gives authenticated users read access only to their own license.
3. Enable email sign-in, configure the site URL and allowlist the localhost and deployment URLs under Authentication → URL Configuration. The UI uses Supabase's email-link authentication; configure a production email provider before launch.
4. Restart development/rebuild after changing public environment variables. Configure the same values in the hosting environment for subsequent builds.
5. Connect a verified server-side payment webhook before selling Premium. Grant Premium only from a trusted server after checking successful payment. Clients cannot update the licenses table, and no checkout grants access in this site.

Until Supabase is configured, the account dialog shows an honest unavailable state. It never invents accounts or saves email addresses locally. The live integration and SQL migration still require validation against the user's Supabase project.

## Assets

The files in reference-assets were exported from the rendered reference site using its observed asset inventory. Its manifest retains their source URLs. The main website uses the supplied logo, the reference's Geist fonts, and its mountain photography. Other reference photos, logos and icons are retained for adaptation, not presented as Syntra customer endorsements. Original compiled JavaScript is not imported. The React implementation is newly authored. Assets accessible in the preview are not a replacement for the original editable commercial template source.

## Release checklist

- Confirm the Premium billing period and final Free/Premium feature split.
- Supply the installer URL and verify the final executable separately.
- Connect and test the Supabase project and account isolation.
- Connect the payment provider and verified webhook.
- Add the actual business's privacy policy and terms before public launch.
