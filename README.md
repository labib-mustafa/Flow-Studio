<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ceabc91f-be6b-4900-95c8-301903a85e87

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## ⚠️ Security Warning

**Important Note regarding Git History:** 
Previously, some API keys and configuration secrets (such as Firebase keys) may have been hardcoded in this codebase. Even though they have now been moved to environment variables, the old values are still accessible in the Git history. 

**ACTION REQUIRED:** If you have previously committed any sensitive, real API keys or passwords, you must **rotate those secrets immediately** in your provider's dashboard (e.g., Firebase, Stripe, Supabase). Do not rely on removing them from the current code state to keep them secure.
