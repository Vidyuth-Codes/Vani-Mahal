import React, { useState, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase.js';
import { useNavigate } from 'react-router-dom';

function AdminHome() {
    const navigate = useNavigate();
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [bookings, setBookings] = useState([]);
    const [customerBookingCounts, setCustomerBookingCounts] = useState({});
    const [eventName, setEventName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [error, setError] = useState('');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (isDarkMode) document.body.classList.add('dark-theme');
        else document.body.classList.remove('dark-theme');
    }, [isDarkMode]);

    // --- REAL-TIME DATA FETCHING ---
    useEffect(() => {
        const bookingsRef = collection(db, 'bookings');
        // onSnapshot creates a real-time listener
        const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Sort bookings by date
            bookingsData.sort((a, b) => new Date(a.date) - new Date(b.date));
            setBookings(bookingsData);

            // Calculate customer booking counts
            const counts = bookingsData.reduce((acc, booking) => {
                acc[booking.customerEmail] = (acc[booking.customerEmail] || 0) + 1;
                return acc;
            }, {});
            setCustomerBookingCounts(counts);
        });

        // Cleanup the listener when the component unmounts
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        try { await signOut(auth); navigate('/login'); } 
        catch (error) { console.error("Error signing out:", error); }
    };

    // --- SCHEDULE EVENT FUNCTION ---
    const handleScheduleEvent = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Validation
        if (endTime <= startTime) {
            setError('End time must be after start time.'); return;
        }

        try {
            // 2. Check for booking conflicts before creating
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            let isBooked = false;
            querySnapshot.forEach((doc) => {
                const booking = doc.data();
                if (startTime < booking.endTime && endTime > booking.startTime) {
                    isBooked = true;
                }
            });

            if (isBooked) {
                setError('This time slot is already booked. Please choose another time.');
                return;
            }

            // 3. If no conflict, add the new booking document
            await addDoc(collection(db, 'bookings'), {
                eventName, customerName, customerEmail, date, startTime, endTime
            });

            // 4. Reset form fields
            setEventName(''); setCustomerName(''); setCustomerEmail('');
            setDate(''); setStartTime(''); setEndTime('');

        } catch (err) {
            console.error("Error scheduling event:", err);
            setError('Failed to schedule the event. Please try again.');
        }
    };

    // --- CANCEL BOOKING FUNCTION ---
    const handleCancelBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try {
                await deleteDoc(doc(db, 'bookings', bookingId));
            } catch (error) {
                console.error("Error cancelling booking:", error);
                alert('Failed to cancel booking.');
            }
        }
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Welcome, Admin! Manage your theatre bookings below.</p>
                <div className="header-buttons">
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="theme-toggle-button">{isDarkMode ? 'Light' : 'Dark'} Mode</button>
                    <button onClick={handleLogout} className="logout-button">Log Out</button>
                </div>
            </header>
            
            <div className="admin-content">
                <section className="form-section">
                    <h2>Schedule a New Event</h2>
                    <form onSubmit={handleScheduleEvent} className="booking-form">
                        {/* Form inputs are the same as before */}
                        <div className="form-row"><div className="form-group"><label htmlFor="event-name">Event Name</label><input type="text" id="event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} required /></div></div>
                        <div className="form-row"><div className="form-group"><label htmlFor="customer-name">Customer Name</label><input type="text" id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div><div className="form-group"><label htmlFor="customer-email">Customer Email</label><input type="email" id="customer-email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required /></div></div>
                        <div className="form-row"><div className="form-group"><label htmlFor="date">Date</label><input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required /></div><div className="form-group"><label htmlFor="start-time">Start Time</label><input type="time" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div><div className="form-group"><label htmlFor="end-time">End Time</label><input type="time" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></div></div>
                        <button type="submit" className="schedule-button">Schedule Event</button>
                        {error && <p className="error-message">{error}</p>}
                    </form>
                </section>

                <section className="list-section">
                    <h2>Current Bookings</h2>
                    <div className="booking-list">
                        {bookings.length > 0 ? bookings.map(booking => (
                            <div key={booking.id} className="booking-item">
                                <div className="booking-details">
                                    <h4 className="event-name">{booking.eventName}</h4>
                                    <p className="customer-info">
                                        <strong>Customer:</strong> {booking.customerName} ({booking.customerEmail})
                                        {customerBookingCounts[booking.customerEmail] > 1 ? (<span className="tag repeat-customer">Repeat ({customerBookingCounts[booking.customerEmail]})</span>) : (<span className="tag first-time">First-time</span>)}
                                    </p>
                                    <p className="date-time-info"><strong>When:</strong> {booking.date} from {booking.startTime} to {booking.endTime}</p>
                                </div>
                                <button onClick={() => handleCancelBooking(booking.id)} className="cancel-button">Cancel</button>
                            </div>
                        )) : (<p>No bookings found.</p>)}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default AdminHome;

