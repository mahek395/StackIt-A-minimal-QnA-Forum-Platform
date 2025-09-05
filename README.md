# StackIt - A Minimal Q&A Forum Platform

StackIt is a minimal, modern Q&A forum platform built with React (Vite) and Node.js/Express/MongoDB. It supports user authentication, question/answer posting, comments, voting, and real-time notifications.

## Features
- User registration and login
- Ask and answer questions
- Comment on answers
- Upvote/downvote answers
- Accept answers (by question owner)
- Notification system (answers, comments, @mentions)
- AI-powered tag suggestion for questions (uses an external model API)
- Responsive, clean UI

## Tech Stack
- **Frontend:** React (Vite, Tailwind CSS)
- **Backend:** Node.js, Express
- **Database:** MongoDB (Mongoose)

## Getting Started

### Prerequisites
- Node.js (v16+ recommended)
- MongoDB (local or Atlas)

### Setup
1. **Clone the repo:**
   ```sh
   git clone https://github.com/yourusername/StackIt-A-minimal-Q-A-Forum-Platform.git
   cd StackIt-A-minimal-Q-A-Forum-Platform
   ```
2. **Install dependencies:**
   - Backend:
     ```sh
     cd backend
     npm install
     ```
   - Frontend:
     ```sh
     cd ../vite-project
     npm install
     ```
3. **Configure environment variables:**
   - Copy `.env.example` to `.env` in the backend folder and fill in your MongoDB URI and JWT secret.

4. **Run the app:**
   - Start backend:
     ```sh
     cd backend
     npm start
     ```
   - Start frontend:
     ```sh
     cd ../vite-project
     npm run dev
     ```

5. **Visit:**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:5000](http://localhost:5000)

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
[MIT](LICENSE)
