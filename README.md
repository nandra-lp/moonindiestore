#  MoonindieStore

<p align="center">
  <strong>Modern E-Commerce Web Application</strong>
  <br>
  A clean, responsive, and scalable online store built with Next.js and Firebase.
</p>

<p align="center">
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-features">Features</a> •
  <a href="#-tech-stack">Tech Stack</a> •
  <a href="#-roadmap">Roadmap</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-000000?style=flat-square&logo=next.js&logoColor=white" alt="Next.js">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React">
  <img src="https://img.shields.io/badge/Firebase-Cloud-FFCA28?style=flat-square&logo=firebase&logoColor=black" alt="Firebase">
  <img src="https://img.shields.io/badge/Netlify-Deployed-00C7B7?style=flat-square&logo=netlify&logoColor=white" alt="Netlify">
</p>

---

## ✨ Overview

**MoonindieStore** is a modern e-commerce web application focused on a clean interface, responsive experience, and scalable architecture.

Built with **Next.js**, **React**, and **Firebase**, the project is designed to support modern e-commerce features while remaining easy to maintain and extend.

---

## 🚀 Features

* 🛍️ Modern & responsive e-commerce interface
* 🔐 Firebase Authentication
* ☁️ Cloud Firestore integration
* 📱 Mobile-friendly design
* ⚡ Next.js application architecture
* 🔒 Environment-based Firebase configuration
* 🚀 Netlify deployment
* 📦 Scalable project structure

---

## 🧩 Tech Stack

| Technology             | Usage                           |
| ---------------------- | ------------------------------- |
| **Next.js 15**         | Application framework           |
| **React 19**           | UI development                  |
| **Firebase**           | Authentication & cloud services |
| **Cloud Firestore**    | Database                        |
| **TypeScript**         | Application development         |
| **CSS / Tailwind CSS** | Styling                         |
| **Netlify**            | Deployment                      |
| **Git & GitHub**       | Version control                 |

---

## 📁 Project Structure

```text
moonindiestore/
├── public/
│   └── assets/
│
├── src/
│   ├── app/
│   ├── components/
│   └── lib/
│       └── firebase.ts
│
├── .env.local
├── .gitignore
├── package.json
├── next.config.ts
└── tsconfig.json
```

> The structure may evolve as the application grows.

---

## 🛠️ Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/USERNAME/moonindiestore.git
cd moonindiestore
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure Firebase

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_FIREBASE_API_KEY="your_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your_project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your_project.firebasestorage.app"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="your_app_id"
```

Replace the values with your Firebase Web App configuration.

> ⚠️ Never commit `.env.local`, Firebase Admin credentials, private keys, or service-account files.

If Firebase Storage is enabled, configure cross-origin uploads for product images and custom designs by applying `cors.json` to the Firebase Storage bucket. Payment proofs use Supabase and do not depend on Firebase Storage CORS:

```bash
gcloud storage buckets update gs://mis-db-1e50d.firebasestorage.app --cors-file=cors.json
```

Run this from the repository root with Google Cloud CLI authenticated to the Firebase project. `firebase deploy` does not apply the bucket CORS configuration.

### Payment proof storage (Supabase)

Only customer payment proofs use Supabase Storage. Product images, custom designs, and all other Firebase Storage uploads remain unchanged.

1. Create a Supabase project. Configure `SUPABASE_URL` as a Firebase Functions parameter and `SUPABASE_SERVICE_ROLE_KEY` as a Firebase Secret. `NEXT_PUBLIC_SUPABASE_ANON_KEY` remains a public client variable; never expose the service-role key with a `NEXT_PUBLIC_` prefix.
2. Deploy the `paymentProofApi` Firebase Cloud Function (`firebase deploy --only functions:paymentProofApi`). Set the `SUPABASE_SERVICE_ROLE_KEY` secret first with `firebase functions:secrets:set SUPABASE_SERVICE_ROLE_KEY`, and provide `SUPABASE_URL` when prompted. The function uses the Firebase runtime service account to verify tokens and access Firestore; grant it the required Firestore permissions. Do not copy Firebase Admin credentials or the Supabase service-role key into Cloudflare.
3. Set `PAYMENT_PROOF_API_BASE_URL` in the Next.js hosting environment to the deployed function URL. This server-side proxy forwards the Firebase ID token; the Cloud Function verifies the token and checks the user's role and order ownership.
4. Link the Supabase CLI to the project and create the private, size- and MIME-restricted bucket:

   ```bash
   npx supabase login
   npx supabase link --project-ref <your-project-ref>
   npx supabase db push
   ```

   This applies `supabase/migrations/20261110220000_create_private_payment_proofs_bucket.sql`. The bucket is private; the application server issues short-lived upload and download URLs after checking the Firebase user's role and order ownership.
5. Redeploy the Next.js app after setting `PAYMENT_PROOF_API_BASE_URL`. New proofs go to Supabase; existing Firebase proof links continue to work.

### 4. Run the development server

```bash
npm run dev
```

Then open:

```text
http://localhost:3000
```

---

## 📦 Production

Build the application:

```bash
npm run build
```

Run the production build:

```bash
npm run start
```

---

## 🗺️ Roadmap

* [ ] Product catalog
* [ ] Product detail
* [ ] Shopping cart
* [ ] Wishlist
* [ ] Order management
* [ ] Payment integration
* [ ] User profile
* [ ] Admin dashboard
* [ ] Search & filtering
* [ ] Firebase Security Rules optimization

---

##  Developer

<p align="center">
  <strong>Developed by Nandraluthfi</strong>
  <br>
  <sub>Designed, developed, and maintained by Nandraluthfi.</sub>
</p>

---

<p align="center">
   <strong>MoonindieStore</strong>
  <br>
  <sub>Modern e-commerce experience powered by Next.js & Firebase.</sub>
</p>
