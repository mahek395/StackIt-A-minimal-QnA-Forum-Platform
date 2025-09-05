// src/router.js
import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './components/AppLayout';
import HomePage from './components/HomePage';
import ErrorPage from './components/ErrorPage';
import Login from './components/Login';
import SignUp from './components/SignUp';
import AnswersPg from './components/AnswersPg';
import AskQuestion from './components/AskQuestion';
import ProtectedRoute from './components/ProtectedRoute';


export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'signup',
        element: <SignUp />,
      },
      {
        path: 'questions/:questionId',
        element: (
            <ProtectedRoute>
              <AnswersPg />
            </ProtectedRoute>
        ),
      },
      {
        path: 'ask',
        element: (
          <ProtectedRoute>
            <AskQuestion />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
