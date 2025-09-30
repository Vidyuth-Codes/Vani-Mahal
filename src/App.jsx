import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
// 1. Import the UserHome component
import UserHome from './pages/UserHome'; 
import AdminHome from './pages/AdminHome';
import SignUp from './pages/SignUp';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Login />} />
        <Route path='/signup' element={<SignUp/>}/>
        <Route path='/admin' element ={<AdminHome/>}/>
        {/* It's convention to keep paths lowercase */}
        <Route path='/login' element={<Login />} /> 
        
        {/* 2. Fixed the typo from 'elemt' to 'element' */}
        <Route path='/home' element={<UserHome />} /> 
      </Routes>
    </BrowserRouter>
  );
}

export default App;

