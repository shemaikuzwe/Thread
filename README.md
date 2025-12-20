# Thread

A real-time messaging application with threaded conversations, file sharing, and modern UI.

## Features

- **Real-time Messaging**: Instant messaging with WebSocket connections
- **Threaded Conversations**: Organize messages into threads for better discussion flow
- **File Sharing**: Upload and preview images, PDFs, videos, and other files
- **Authentication**: Login with Google or GitHub OAuth
- **Responsive Design**: Works on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing

## Tech Stack

### Backend
- **Go** (Gin framework)
- **PostgreSQL** for data storage
- **Redis** for caching and session management
- **WebSocket** for real-time communication
- **JWT** for authentication

### Frontend
- **React** 
- **Vite** 
- **React Router**
- **Tailwind CSS** 
- **Shadcn UI** 
- **UploadThing** 

## Getting Started

### Prerequisites
- Go 1.24+
- Node.js 18+
- PostgreSQL
- Redis

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/shemaIkuzwe/thread.git
   cd thread
   ```

2. Set up the backend:
   ```bash
   cd backend
   go mod download
   cp .env.example .env
   # Edit .env with your database and OAuth credentials
   go run main.go
   ```

3. Set up the frontend:
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   # Edit .env with your API URLs
   npm run dev
   ```

4. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a pull request

Please ensure your code follows the existing style and includes tests where appropriate.
