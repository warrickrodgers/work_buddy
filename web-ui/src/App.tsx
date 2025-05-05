import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassowrd';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './pages/dashboard/dashboard';
import './App.css'

function App() {
  return (
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
        />
      </Routes>
    </Router>
  )
}

export default App
