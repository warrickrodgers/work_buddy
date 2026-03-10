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
import { CreateChallenge } from './pages/dashboard/dashPages/Challenges/CreateChallenge';
import { ChallengeDashboard } from './pages/dashboard/dashPages/Challenges';
import { ChallengeDetail } from './pages/dashboard/dashPages/Challenges/ChallengeDetail';
import { WorkBuddyChat } from './pages/dashboard/dashPages/WorkBuddyChats/WorkBuddyChat';
import { DashboardHome } from './pages/dashboard/dashPages/DashboardHome';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
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
            <Route index element={<DashboardHome />} />
            <Route path="/dashboard/challenges/" element={<ChallengeDashboard />}/>
            <Route path="/dashboard/challenges/createchallenge" element={<CreateChallenge />}/>
            <Route path="/dashboard/challenges/:id" element={<ChallengeDetail />} />
            <Route path="/dashboard/workbuddychats/workbuddychat" element={<WorkBuddyChat />}/>
            <Route path="/dashboard/uploads" element={<UploadsInsetPage />}></Route>
            <Route path="/dashboard/uploads/new-upload" element={<NewUploadInsetPage />}/>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
