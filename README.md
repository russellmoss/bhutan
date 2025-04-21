# Bhutan Wine Company App

A React application for Bhutan Wine Company that manages customer information and social engagement tracking.

## Features

- Customer information collection
- Social media engagement tracking (Google Reviews & Instagram)
- Admin dashboard for customer management
- CSV export functionality
- Responsive design

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- Firebase account

## Installation

1. Clone the repository:
```bash
git clone https://github.com/russellmoss/bhutan.git
cd bhutan
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your Firebase configuration:
```env
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
```

## Development

To run the development server:

```bash
npm start
```

The app will be available at [http://localhost:3000](http://localhost:3000)

## Building for Production

To create a production build:

```bash
npm run build
```

## Deployment to Netlify

### Manual Deployment

1. Create a new site on Netlify
2. Connect to your GitHub repository
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `build`
4. Add environment variables in Netlify:
   - Go to Site settings > Build & deploy > Environment
   - Add all variables from your `.env` file

### Automatic Deployment

The app is set up for continuous deployment with Netlify. Any push to the `master` branch will trigger a new deployment.

## Environment Variables

The following environment variables are required:

- `REACT_APP_FIREBASE_API_KEY`
- `REACT_APP_FIREBASE_AUTH_DOMAIN`
- `REACT_APP_FIREBASE_PROJECT_ID`
- `REACT_APP_FIREBASE_STORAGE_BUCKET`
- `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`
- `REACT_APP_FIREBASE_APP_ID`

## Firebase Setup

1. Create a new Firebase project
2. Enable Firestore Database
3. Set up Authentication (Email/Password)
4. Add your deployment domain to Firebase Authentication authorized domains

## License

This project is private and proprietary to Bhutan Wine Company.
