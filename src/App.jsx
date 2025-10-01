import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import UserHome from './pages/UserHome';
import AdminHome from './pages/AdminHome';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* The UserHome is now the default page for the root path '/' */}
        <Route path="/" element={<UserHome />} />

        {/* We keep the AdminHome route */}
        <Route path="/admin" element={<AdminHome />} />

        {/* All other routes related to login/signup are now gone. */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;

