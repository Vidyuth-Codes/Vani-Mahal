import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

const ADMIN_CONTACT_INFO = "+91 12345 67890";

function UserHome() {
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [availability, setAvailability] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    const goToAdminPage = () => {
        navigate('/admin');
    };

    const handleCheckAvailability = async () => {
        if (date < today || !date || !startTime || !endTime || endTime <= startTime) {
            setErrorMessage('Please select a valid, future date and time range.');
            setAvailability('error');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setAvailability('idle');
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            let isBooked = false;
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                if (startTime < booking.endTime && endTime > booking.startTime) { isBooked = true; }
            });
            setAvailability(isBooked ? 'booked' : 'available');
        } catch (error) {
            console.error("Error checking availability: ", error);
            setErrorMessage('Could not check availability. Please try again.');
            setAvailability('error');
        } finally {
            setIsLoading(false);
        }
    };
    
    const renderResultMessage = () => {
        if (isLoading) { return <div className="result-card loading"><h3>Checking...</h3></div>; }
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
                <div className="header-buttons">
                    <button onClick={goToAdminPage} className="admin-button">Admin</button>
                </div>
            </header>
            
            <main className="checker-container">
                <h2>Check Hall Availability</h2>
                <div className="date-time-picker">
                    {/* --- CHANGES START HERE --- */}
                    {/* Each div is now a label, and the text is in a span */}
                    <label htmlFor="date-picker" className="input-group">
                        <span>Select Date</span>
                        <input type="date" id="date-picker" value={date} onChange={(e) => setDate(e.target.value)} min={today} />
                    </label>

                    <label htmlFor="start-time" className="input-group">
                        <span>Start Time</span>
                        <input type="time" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                    </label>

                    <label htmlFor="end-time" className="input-group">
                        <span>End Time</span>
                        <input type="time" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                    </label>
                    {/* --- CHANGES END HERE --- */}
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