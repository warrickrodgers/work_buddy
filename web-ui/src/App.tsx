import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassowrd';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/dashboard/Dashboard';
import './App.css'
import UploadsInsetPage  from './pages/dashboard/dashPages/Uploads/Uploads';
import NewUploadInsetPage from './pages/dashboard/dashPages/Uploads/NewUpload';
import './App.css';
import { WorkBuddyChat } from './pages/dashboard/dashPages/WorkBuddyChats.tsx/WorkBuddyChat';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path='/' element={< Home/>}></Route>
          <Route path="/signup" element={< SignUp/>}></Route>
          <Route path="/login" element={< Login/>}></Route>
          <Route path="/forgotPassword" element={< ForgotPassword/>}></Route>
          <Route 
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          >
            {/* Nested routes within Dashboard (the "inset") */}
            <Route path="/dashboard/workbuddychats/workbuddychat" element={<WorkBuddyChat />}/>
            <Route path="/dashboard/uploads" element={<UploadsInsetPage />}></Route>
            <Route path="/dashboard/uploads/new-upload" element={<NewUploadInsetPage />}/>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App
