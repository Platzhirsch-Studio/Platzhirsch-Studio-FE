<p align="center">
  <img src="./public/Images/Navbar/Logo.png" width="200" />
</p>


🛋️ Platzhirsch Studio – General Branch

Welcome to the general branch of the official website developed by IT Engineers for Platzhirsch Studio.

This branch is dedicated to developers for implementing and refining new features. All development work should be carried out in this branch. Once a feature is completed and verified, it should be merged into the develop branch for further testing and integration.

📌 Project Overview

This website showcases the furniture collections, interior design concepts, and studio experience of Platzhirsch Studio. Built for visual richness and performance, it supports modular content, elegant UI components, and optimized loading.

Frontend: Next.js (App Router, JavaScript, Tailwind CSS)

Backend: PvOne

🛠️ Tech Stack

Frontend

Framework: Next.js – App Router

Language: JavaScript

Styling: Tailwind CSS

Folder Structure:

src/
  ├── app/              → Application routing and pages
  ├── components/       → Reusable UI and logic components
public/                 → Static assets and SVGs

Backend

PvOne

PvOne Framework

🚀 Getting Started (Frontend)

✅ Prerequisites

Node.js v18+

npm or Yarn

📦 Installation

Clone the repository:

git clone http://ead19aa6fcd8624eb9a0dd4a4209cfad8451adb7@46.99.162.142:3000/Platzhirsch-Studio/PlatzhirschStudio-Website.git --branch general

cd PlatzhirschStudio-Website

Install dependencies:

npm install
# or
yarn install

npm run dev
# or
yarn dev

Access the frontend:

Open your browser and visit: http://localhost:3000

🧱 Getting Started (Backend – PvOne)

The backend uses the PvOne Framework with customizations under the PvOne application.

📌 Backend Prerequisites

Python 3.10+

Node.js & Yarn

Redis

MariaDB 10.6+

wkhtmltopdf (with patched Qt)

PvOne Framework Bench CLI

📅 Backend Setup

ℹ️ We have created a custom shell script that automatically installs and configures PvOne Framework for you.

To start the backend server:

Connect to the server using PuTTY or terminal.

Navigate to the bench directory:

cd /path/to/oekovolt-backend

Start the server:

bench start

Access the PvOne backend:http://ip-address:8000

💼 Directory Highlights

src/app/ – All route-based pages (/agb, /kontakt, /referenzen, etc.)

src/components/ – Modular components by feature (e.g., Navbar, Jobs, Project, etc.)

public/ – Static assets such as logos and SVG icons

globals.css – Global Tailwind and custom styles

layout.js – Root layout wrapper

page.js – Homepage route

🔀 Development Workflow

Work on a new branch from develop.

Implement and test your features.

Commit with meaningful messages.

Push to the remote develop branch.

📄 License

This platform is proprietary software, developed exclusively by Solensa HUB for Platzhirsch Studio.

📢 Contact

Solensa HUB LLC 📧 Email: office@it-bedarf.com 🌐 Website: https://www.solensa.at

© 2026 Solensa HUB – All Rights Reserved