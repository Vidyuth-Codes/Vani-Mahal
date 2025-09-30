import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase.js';
import { useAuth } from '../AuthContext.jsx'; // Corrected import path

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Get user info, role, AND the loading state from our context
    const { currentUser, userRole, loading } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            // No navigation here. The redirect logic below will handle it.
        } catch (err) {
            setError('Failed to log in. Please check your email and password.');
            console.error("Error logging in:", err);
        }
        setIsSubmitting(false);
    };
    
    // THIS IS THE CRITICAL CHANGE:
    // We now wait for the initial loading to be false AND for the userRole to be set.
    if (!loading && currentUser && userRole) {
        return userRole === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/home" />;
    }

    // A simple loading indicator for when the app is first loading the user state
    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div id='main-div'>
            <div>
                <h1 id="heading">Welcome To Our Live Theatre</h1>
            </div>
            <div className='form-container'>
                <form onSubmit={handleLogin}>
                    <label htmlFor="email-input">Enter Your Email</label>
                    <input id="email-input" type="email" placeholder='Email Here' value={email} onChange={(e) => setEmail(e.target.value)} required />
                    <label htmlFor="password-input">Enter Your Password</label>
                    <input id="password-input" type="password" placeholder='Password Here' value={password} onChange={(e) => setPassword(e.target.value)} required />
                    <button id='submit' type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Logging in...' : 'Log In'}
                    </button>
                    {error && <p className="error-message">{error}</p>}
                </form>
                <p className="form-link">
                    Don't have an account? <Link to="/signup">Sign Up</Link>
                </p>
            </div>
        </div>
    );
}
export default Login;

