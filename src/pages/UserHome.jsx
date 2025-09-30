import React, { useState, useEffect, useRef } from 'react';
import { signOut } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Import Firestore functions
import { auth, db } from '../firebase.js'; // Import auth and db
import { useNavigate } from 'react-router-dom';

const ADMIN_CONTACT_INFO = "+91 12345 67890";

function UserHome() {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [availability, setAvailability] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false); // For loading indicator
    const today = new Date().toISOString().split('T')[0];
    const dateInputRef = useRef(null);
    const startTimeInputRef = useRef(null);
    const endTimeInputRef = useRef(null);

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    }, [isDarkMode]);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    // --- THIS IS THE MAIN UPDATED FUNCTION ---
    const handleCheckAvailability = async () => {
        // Run validation first
        if (date < today || !date || !startTime || !endTime || endTime <= startTime) {
            setErrorMessage('Please select a valid, future date and time range.');
            setAvailability('error');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setAvailability('idle');

        try {
            // 1. Create a query to get all bookings for the selected date
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("date", "==", date));

            // 2. Execute the query
            const querySnapshot = await getDocs(q);
            
            let isBooked = false;
            // 3. Loop through the results and check for time overlap
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                // Classic overlap logic: (startA < endB) and (endA > startB)
                if (startTime < booking.endTime && endTime > booking.startTime) {
                    isBooked = true;
                }
            });

            // 4. Set the result based on the check
            if (isBooked) {
                setAvailability('booked');
            } else {
                setAvailability('available');
            }

        } catch (error) {
            console.error("Error checking availability: ", error);
            setErrorMessage('Could not check availability. Please try again.');
            setAvailability('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderResultMessage = () => {
        if (isLoading) {
            return <div className="result-card loading"><h3>Checking...</h3></div>;
        }
        switch (availability) {
            case 'available': return ( <div className="result-card available"> <h3>Great News! The Theatre is Available.</h3> <p>To finalize your booking, please contact the admin at:</p> <p className="contact-info">{ADMIN_CONTACT_INFO}</p> </div> );
            case 'booked': return ( <div className="result-card booked"> <h3>Sorry, the Theatre is Booked.</h3> <p>Please try a different date or time for your event.</p> </div> );
            case 'error': return ( <div className="result-card error"> <h3>Request Failed</h3> <p>{errorMessage}</p> </div> );
            default: return null;
        }
    };

    return (
        <div className="home-container">
            <header className="home-header">
                <h1>Theatre Availability</h1>
                <p>Welcome, User!</p>
                <div className="header-buttons">
                    <button onClick={handleLogout} className="logout-button">Log Out</button>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle-button">{isDarkMode ? 'Light' : 'Dark'} Mode</button>
                </div>
            </header>
            
            <main className="checker-container">
                <h2>Check Hall Availability</h2>
                <div className="date-time-picker" >
                    <div className="input-group" onClick={() => dateInputRef.current.showPicker()}><label htmlFor="date-picker">Select Date</label><input type="date" id="date-picker" ref={dateInputRef} value={date} onChange={(e) => setDate(e.target.value)} min={today} /></div>
                    <div className="input-group" onClick={() => startTimeInputRef.current.showPicker()}><label htmlFor="start-time">Start Time</label><input type="time" id="start-time"ref={startTimeInputRef} value={startTime} onChange={(e) => setStartTime(e.target.value)} step="900"/></div>
                    <div className="input-group" onClick={() => endTimeInputRef.current.showPicker()}><label htmlFor="end-time">End Time</label><input type="time" id="end-time" ref={endTimeInputRef} value={endTime} onChange={(e) => setEndTime(e.target.value)} step="900"/></div>
                </div>
                <button className="check-button" onClick={handleCheckAvailability} disabled={isLoading}>
                    {isLoading ? 'Checking...' : 'Check Availability'}
                </button>
            </main>

            <section className="results-section">
                {renderResultMessage()}
            </section>
        </div>
    );
}

export default UserHome;

