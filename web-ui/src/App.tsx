import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassowrd';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/dashboard/Dashboard';
import UploadsInsetPage from './pages/dashboard/dashPages/Uploads/Uploads';
import NewUploadInsetPage from './pages/dashboard/dashPages/Uploads/NewUpload';
import { WorkBuddyChat } from './pages/dashboard/dashPages/WorkBuddyChats/WorkBuddyChat';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path='/' element={<Home />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgotPassword" element={<ForgotPassword />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            >
              <Route path="/dashboard/workbuddychats/workbuddychat" element={<WorkBuddyChat />} />
              <Route path="/dashboard/uploads" element={<UploadsInsetPage />} />
              <Route path="/dashboard/uploads/new-upload" element={<NewUploadInsetPage />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
