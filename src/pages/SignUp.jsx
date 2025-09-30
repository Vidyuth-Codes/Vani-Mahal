import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase.js'; // Import your Firebase config

function SignUp() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors

        try {
            // 1. Create the user in Firebase Authentication
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Create a corresponding user document in Firestore
            // This is crucial for storing user roles and other data.
            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: user.email,
                role: 'user' // Assign a default role of 'user'
            });

            // 3. Redirect to the login page after successful signup
            navigate('/login');

        } catch (err) {
            setError(err.message);
            console.error("Error signing up:", err);
        }
    };

    return (
        <div id="main-div">
            <div>
                <h1 id="heading">Create Your Account</h1>
            </div>
            <div className="form-container">
                <form onSubmit={handleSignUp}>
                    <label htmlFor="email-input">Email</label>
                    <input
                        id="email-input"
                        type="email"
                        placeholder='Enter your email'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="password-input">Password</label>
                    <input
                        id="password-input"
                        type="password"
                        placeholder='Create a password'
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button id="submit" type="submit">Sign Up</button>
                    {error && <p className="error-message">{error}</p>}
                </form>
                <p className="form-link">
                    Already have an account? <Link to="/login">Log In</Link>
                </p>
            </div>
        </div>
    );
}

export default SignUp;
