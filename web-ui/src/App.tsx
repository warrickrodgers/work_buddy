import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import SignUp from './pages/auth/SignUp';
import Login from './pages/auth/Login';
import ForgotPassword from './pages/auth/ForgotPassowrd';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path='/' element={< Home/>}></Route>
        <Route path="/signup" element={< SignUp/>}></Route>
        <Route path="/login" element={< Login/>}></Route>
        <Route path="/forgotPassword" element={< ForgotPassword/>}></Route>
      </Routes>
    </Router>
  )
}

export default App
