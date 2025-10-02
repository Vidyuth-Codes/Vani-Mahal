import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

const ADMIN_CONTACT_INFO = "+91 12345 67890";

function UserHome() {
    const navigate = useNavigate();
    const [date, setDate] = useState('');
    // State for the new time slot dropdown
    const [timeSlot, setTimeSlot] = useState('');
    const [availability, setAvailability] = useState('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const today = new Date().toISOString().split('T')[0];

    const goToAdminPage = () => {
        navigate('/admin');
    };

    // --- THIS IS THE MAIN UPDATED FUNCTION ---
    const handleCheckAvailability = async () => {
        // Updated validation
        if (date < today || !date || !timeSlot) {
            setErrorMessage('Please select a valid, future date and a time slot.');
            setAvailability('error');
            return;
        }
        setErrorMessage('');
        setIsLoading(true);
        setAvailability('idle');

        try {
            // 1. Get all bookings for the selected date
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            const todaysBookings = querySnapshot.docs.map(doc => doc.data().time);

            let isBooked = false;
            // 2. Implement the new conflict logic
            if (timeSlot === 'Whole Day') {
                // If user wants the whole day, it's booked if ANY slot is taken.
                if (todaysBookings.length > 0) {
                    isBooked = true;
                }
            } else { // User wants 'FN' or 'AN'
                // It's booked if that specific slot is taken OR the whole day is taken.
                if (todaysBookings.includes(timeSlot) || todaysBookings.includes('Whole Day')) {
                    isBooked = true;
                }
            }

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
                    <label htmlFor="date-picker" className="input-group">
                        <span>Select Date</span>
                        <input type="date" id="date-picker" value={date} onChange={(e) => setDate(e.target.value)} min={today} />
                    </label>

                    {/* --- REPLACED TIME INPUTS WITH A DROPDOWN --- */}
                    <label htmlFor="time-slot-picker" className="input-group">
                        <span>Select Time Slot</span>
                        <select 
                            id="time-slot-picker" 
                            value={timeSlot} 
                            onChange={(e) => setTimeSlot(e.target.value)}
                        >
                            <option value="" disabled>-- Select a Time --</option>
                            <option value="FN">FN (Forenoon)</option>
                            <option value="AN">AN (Afternoon)</option>
                            <option value="Whole Day">Whole Day</option>
                        </select>
                    </label>
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

