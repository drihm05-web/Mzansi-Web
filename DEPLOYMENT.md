# Deployment Guide: Mzansi Web Design Agency

This guide explains how to take this application from AI Studio and host it independently on your own GitHub or Vercel account.

## 1. Firebase Setup (The Backend)
The application requires a Firebase backend to store orders, users, and settings.

1. Create a new project at [Firebase Console](https://console.firebase.google.com/).
2. Enable **Google Authentication** in the "Authentication" section.
3. Create a **Firestore Database** in "Production Mode".
4. Copy your Web App configuration and update `src/firebase-applet-config.json`.
5. **Security Rules:** Copy the contents of `firestore.rules` from this project and paste them into the "Rules" tab of your Firestore database in the Firebase Console.

## 2. Option A: Hosting on Vercel (Recommended)
Vercel is the easiest way to host React applications.

1. Export this code to a **GitHub Repository**.
2. Sign in to [Vercel](https://vercel.com/) using your GitHub account.
3. Click **Add New** > **Project**.
4. Import your repository.
5. Vercel will automatically detect Vite and deploy your site.
6. **Important:** Add your site's URL (e.g., `your-app.vercel.app`) to the **Authorized Domains** list in your Firebase Authentication settings.

## 3. Option B: Hosting on GitHub Pages
1. In your terminal, run: `npm install gh-pages --save-dev`
2. In `package.json`, add:
   - `"homepage": "https://<username>.github.io/<repo-name>"`
   - Under scripts: `"deploy": "gh-pages -d dist"`
3. In `vite.config.ts`, add: `base: '/<repo-name>/'`
4. Run `npm run deploy`.
5. In GitHub Settings > Pages, set the source branch to `gh-pages`.

## 4. Local Development
To run this project on your computer:
1. Install [Node.js](https://nodejs.org/).
2. Run `npm install` to install dependencies.
3. Run `npm run dev` to start the development server.
4. Open `http://localhost:3000` in your browser.

## 5. Environment Variables
If you use any AI features (Gemini), ensure you set the `GEMINI_API_KEY` in your hosting provider's "Environment Variables" section.
