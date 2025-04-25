import React from 'react';
import MyButton from '../components/Button';
import '../styles/tailwind.css'; // Make sure you import the TailwindCSS file

const Login: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <MyButton />
    </div>
  );
};

export default Login;