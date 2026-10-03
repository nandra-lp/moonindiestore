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
