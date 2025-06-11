# Frontend Application

A modern React-based web application built with performance, security, and user experience in mind.

## 🚀 Features

- **Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **Interactive Maps** - Powered by Mapbox for location-based features
- **Real-time Updates** - Live data synchronization
- **Modern UI/UX** - Clean, intuitive interface with smooth animations
- **Performance Optimized** - Code splitting and lazy loading
- **Accessibility** - WCAG 2.1 compliant interface

## 🛠 Tech Stack

- **Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **Maps**: Mapbox GL JS
- **Build Tool**: Vite
- **Linting**: ESLint + Prettier

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v8.0.0 or higher) or **pnpm** 
- **Git**

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/daniels-mtn-gh/spotter-frontend.git
   cd spotter-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```

## ⚙️ Environment Setup

Create a `.env.local` file in the root directory and configure the following variables:

```env
# Mapbox Configuration
VITE_MAPBOX_TOKEN=pxxxxxxxxx...

## 🚀 Running the Application

### Development Mode
```bash
npm start
# or
yarn start
```
Opens the app at [http://localhost:3000](http://localhost:3000)

### Production Build
```bash
npm run build
# or
yarn build
```

### Preview Production Build
```bash
npm run preview
# or
yarn preview
```


## 🔄 Changelog

See [CHANGELOG.md](CHANGELOG.md) for a list of changes and version history.

---

**Built with ❤️ by Eugene