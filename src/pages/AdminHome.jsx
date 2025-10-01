import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

const ADMIN_PASSWORD = "admin";

function AdminHome() {
    const navigate = useNavigate(); // Initialize navigate
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [bookings, setBookings] = useState([]);
    const [customerBookingCounts, setCustomerBookingCounts] = useState({});
    const [eventName, setEventName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [date, setDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [formError, setFormError] = useState('');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!isAuthenticated) return;
        const bookingsRef = collection(db, 'bookings');
        const unsubscribe = onSnapshot(bookingsRef, (snapshot) => {
            const bookingsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            bookingsData.sort((a, b) => new Date(a.date) - new Date(b.date));
            setBookings(bookingsData);
            const counts = bookingsData.reduce((acc, booking) => {
                acc[booking.customerEmail] = (acc[booking.customerEmail] || 0) + 1;
                return acc;
            }, {});
            setCustomerBookingCounts(counts);
        });
        return () => unsubscribe();
    }, [isAuthenticated]);

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        if (password === ADMIN_PASSWORD) {
            setIsAuthenticated(true);
            setLoginError('');
            setPassword('');
        } else {
            setLoginError('Incorrect password. Please try again.');
        }
    };

    // --- THIS IS THE UPDATED FUNCTION ---
    const handleLogout = () => {
        setIsAuthenticated(false); // Revoke access
        navigate('/');            // Navigate to the main home page
    };

    const handleScheduleEvent = async (e) => {
        e.preventDefault();
        setFormError('');
        if (endTime <= startTime) { setFormError('End time must be after start time.'); return; }
        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            let isBooked = false;
            querySnapshot.forEach((doc) => { const booking = doc.data(); if (startTime < booking.endTime && endTime > booking.startTime) { isBooked = true; } });
            if (isBooked) { setFormError('This time slot is already booked.'); return; }
            await addDoc(collection(db, 'bookings'), { eventName, customerName, customerEmail, date, startTime, endTime });
            setEventName(''); setCustomerName(''); setCustomerEmail(''); setDate(''); setStartTime(''); setEndTime('');
        } catch (err) { console.error("Error scheduling event:", err); setFormError('Failed to schedule the event.'); }
    };

    const handleCancelBooking = async (bookingId) => {
        if (window.confirm('Are you sure you want to cancel this booking?')) {
            try { await deleteDoc(doc(db, 'bookings', bookingId)); } 
            catch (error) { console.error("Error cancelling booking:", error); alert('Failed to cancel booking.'); }
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login-overlay">
                <div className="admin-login-box">
                    <h2>Admin Access</h2>
                    <form onSubmit={handlePasswordSubmit}>
                        <label htmlFor="admin-password">Enter Password</label>
                        <input type="password" id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
                        <button type="submit">Enter</button>
                        {loginError && <p className="error-message">{loginError}</p>}
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Welcome, Admin! Manage your theatre bookings below.</p>
                <div className="header-buttons">
                    <button onClick={handleLogout} className="logout-button">Log Out</button>
                </div>
            </header>
            <div className="admin-content">
                <section className="form-section">
                    <h2>Schedule a New Event</h2>
                    <form onSubmit={handleScheduleEvent} className="booking-form">
                        <div className="form-row"><div className="form-group"><label htmlFor="event-name">Event Name</label><input type="text" id="event-name" value={eventName} onChange={(e) => setEventName(e.target.value)} required /></div></div>
                        <div className="form-row"><div className="form-group"><label htmlFor="customer-name">Customer Name</label><input type="text" id="customer-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required /></div><div className="form-group"><label htmlFor="customer-email">Customer Email</label><input type="email" id="customer-email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required /></div></div>
                        <div className="form-row"><div className="form-group"><label htmlFor="date">Date</label><input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required /></div><div className="form-group"><label htmlFor="start-time">Start Time</label><input type="time" id="start-time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required /></div><div className="form-group"><label htmlFor="end-time">End Time</label><input type="time" id="end-time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required /></div></div>
                        <button type="submit" className="schedule-button">Schedule Event</button>
                        {formError && <p className="error-message">{formError}</p>}
                    </form>
                </section>
                <section className="list-section">
                    <h2>Current Bookings</h2>
                    <div className="booking-list">
                        {bookings.length > 0 ? bookings.map(booking => (
                            <div key={booking.id} className="booking-item">
                                <div className="booking-details"><h4 className="event-name">{booking.eventName}</h4><p className="customer-info"><strong>Customer:</strong> {booking.customerName} ({booking.customerEmail}){customerBookingCounts[booking.customerEmail] > 1 ? (<span className="tag repeat-customer">Repeat ({customerBookingCounts[booking.customerEmail]})</span>) : (<span className="tag first-time">First-time</span>)}</p><p className="date-time-info"><strong>When:</strong> {booking.date} from {booking.startTime} to {booking.endTime}</p></div>
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

