import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import {
    LoginPage,
    RegisterPage,
    AdminPage,
    StudentPage,
    TakeQuizPage,
    CreateQuizPage,
    ManageQuestionsPage,
    QuizResultsPage,
    QuizResultsDetailPage,
    StudentHistoryPage
} from './pages';

import { ProtectedRoute, AuthProvider, Layout } from './components';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <AdminPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/student"
              element={
                <ProtectedRoute requiredRole="ROLE_USER">
                  <StudentPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/take-quiz"
              element={
                <ProtectedRoute requiredRole="ROLE_USER">
                  <TakeQuizPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/student-history"
              element={
                <ProtectedRoute requiredRole="ROLE_USER">
                  <StudentHistoryPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/create-quiz"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <CreateQuizPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/manage-questions/:quizId"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <ManageQuestionsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/quiz-results"
              element={
                <ProtectedRoute requiredRole="ROLE_USER">
                  <QuizResultsPage />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/quiz-results-detail"
              element={
                <ProtectedRoute requiredRole="ROLE_ADMIN">
                  <QuizResultsDetailPage />
                </ProtectedRoute>
              }
            />
            
            <Route index element={<Navigate to="/register" replace />} />
            <Route path="*" element={<Navigate to="/register" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;