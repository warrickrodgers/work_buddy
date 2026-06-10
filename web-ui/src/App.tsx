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
import { OutlineDetail } from './pages/dashboard/dashPages/Outlines/OutlineDetail';
import { OutlineList } from './pages/dashboard/dashPages/Outlines/OutlineList';
import { Settings } from './pages/dashboard/dashPages/Settings/Settings';
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
            {/* Nested routes within Dashboard (the "inset") — use relative paths in RR v7 */}
            <Route index element={<DashboardHome />} />
            <Route path="challenges" element={<ChallengeDashboard />}/>
            <Route path="challenges/createchallenge" element={<CreateChallenge />}/>
            <Route path="challenges/:id/outlines/:outlineId" element={<OutlineDetail />} />
            <Route path="challenges/:id" element={<ChallengeDetail />} />
            <Route path="outlines" element={<OutlineList />} />
            <Route path="workbuddychats/workbuddychat" element={<WorkBuddyChat />}/>
            <Route path="uploads" element={<UploadsInsetPage />}/>
            <Route path="uploads/new-upload" element={<NewUploadInsetPage />}/>
            <Route path="settings" element={<Settings />}/>
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
