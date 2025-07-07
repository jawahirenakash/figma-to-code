# Figma to Code Converter

A scalable, modular application that connects to the Figma API to extract design data and convert it into SwiftUI, Jetpack Compose, and React UI code.

## Features

- 🔐 **OAuth Authentication** with Figma
- 📁 **File Selection** from your Figma workspace
- 🔄 **Design Extraction** using Figma API
- 🎨 **Code Generation** for multiple platforms:
  - SwiftUI (iOS)
  - Jetpack Compose (Android)
  - React (Web)
- 📱 **Modern UI** with Material-UI components
- ⚡ **Fast Development** with Vite

## Architecture

### Backend (Node.js/Express)
- **OAuth Flow**: Secure authentication with Figma
- **API Integration**: Figma API client for file access
- **IR Parser**: Intermediate Representation parser for design data
- **Code Generators**: Platform-specific code generation
- **REST API**: Express server with TypeScript

### Frontend (React/TypeScript)
- **Modern UI**: Material-UI components
- **File Management**: Figma file selection and browsing
- **Code Preview**: Syntax-highlighted code viewing
- **Download**: Export generated code
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- Axios for HTTP requests
- dotenv for environment management

### Frontend
- React 18 with TypeScript
- Material-UI (MUI)
- Vite for fast development
- React Router for navigation

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Figma Developer Account

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd figma-to-code
   ```

2. **Install dependencies**
   ```bash
   # Backend dependencies
   cd backend
   npm install
   
   # Frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   
   Create `.env` file in the `backend/` directory:
   ```env
   FIGMA_CLIENT_ID=your_figma_client_id
   FIGMA_CLIENT_SECRET=your_figma_client_secret
   FIGMA_REDIRECT_URI=http://localhost:4000/api/figma/oauth/callback
   PORT=4000
   ```

4. **Figma App Configuration**
   
   - Go to [Figma Developer Console](https://www.figma.com/developers/apps)
   - Create a new app or use existing one
   - Set OAuth redirect URI to: `http://localhost:4000/api/figma/oauth/callback`
   - Copy Client ID and Client Secret to your `.env` file

### Running the Application

1. **Start the Backend**
   ```bash
   cd backend
   npm run dev
   ```
   Server will run on http://localhost:4000

2. **Start the Frontend**
   ```bash
   cd frontend
   npm run dev
   ```
   App will run on http://localhost:5173

3. **Access the Application**
   - Open http://localhost:5173 in your browser
   - Click "Login with Figma"
   - Authorize the application
   - Select a Figma file
   - Choose your target platform
   - Generate and download code

## Project Structure

```
figma-to-code/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── figma.ts          # Figma API routes
│   │   ├── figma/
│   │   │   └── parser.ts         # IR parser
│   │   ├── generators/
│   │   │   ├── swiftui/          # SwiftUI code generator
│   │   │   ├── jetpack/          # Jetpack Compose generator
│   │   │   └── react/            # React code generator
│   │   └── index.ts              # Express server
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── FileSelector.tsx  # File selection component
│   │   │   └── CodeViewer.tsx    # Code preview component
│   │   ├── pages/
│   │   │   └── Home.tsx          # Main page
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### OAuth Flow
- `GET /api/figma/oauth/login` - Initiate OAuth login
- `GET /api/figma/oauth/callback` - OAuth callback handler

### Figma API
- `POST /api/figma/files` - List user's Figma files
- `POST /api/figma/extract` - Extract design data from file
- `POST /api/figma/generate` - Generate code for selected platform

### Health Check
- `GET /health` - Server health status

## Development

### Backend Development
```bash
cd backend
npm run dev          # Start development server
npm run build        # Build for production
npm start           # Start production server
```

### Frontend Development
```bash
cd frontend
npm run dev         # Start development server
npm run build       # Build for production
npm run preview     # Preview production build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the GitHub repository or contact the development team.

## Roadmap

- [ ] Support for more design platforms (Sketch, Adobe XD)
- [ ] Advanced code generation options
- [ ] Component library integration
- [ ] Real-time collaboration features
- [ ] Cloud deployment options
- [ ] Mobile app versions 