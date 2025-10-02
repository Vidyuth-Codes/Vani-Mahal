import React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, addDoc, deleteDoc, doc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';

const ADMIN_PASSWORD = "admin123";

function AdminHome() {
    const navigate = useNavigate();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState('');
    const [bookings, setBookings] = useState([]);
    const [customerBookingCounts, setCustomerBookingCounts] = useState({});
    
    // Form state
    const [eventName, setEventName] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [date, setDate] = useState('');
    // Replaced startTime and endTime with timeSlot
    const [timeSlot, setTimeSlot] = useState(''); 
    
    const [formError, setFormError] = useState('');
    const today = new Date().toISOString().split('T')[0];
    const passwordInputRef = useRef(null);

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

    useEffect(() => {
        if (!isAuthenticated && passwordInputRef.current) {
            passwordInputRef.current.focus();
        }
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

    const handleLogout = () => {
        setIsAuthenticated(false);
        navigate('/');
    };

    // --- UPDATED EVENT SCHEDULING LOGIC ---
    const handleScheduleEvent = async (e) => {
        e.preventDefault();
        setFormError('');

        try {
            const bookingsRef = collection(db, 'bookings');
            const q = query(bookingsRef, where("date", "==", date));
            const querySnapshot = await getDocs(q);
            const todaysBookings = querySnapshot.docs.map(doc => doc.data().time);

            let isBooked = false;
            if (timeSlot === 'Whole Day') {
                if (todaysBookings.length > 0) isBooked = true;
            } else { // FN or AN
                if (todaysBookings.includes(timeSlot) || todaysBookings.includes('Whole Day')) isBooked = true;
            }

            if (isBooked) {
                setFormError('This time slot is already booked. Please choose another time.');
                return;
            }
            
            // Save the new booking with the 'time' field
            await addDoc(collection(db, 'bookings'), { 
                eventName, customerName, customerEmail, date, time: timeSlot 
            });

            // Reset form fields
            setEventName(''); setCustomerName(''); setCustomerEmail(''); setDate(''); setTimeSlot('');
        } catch (err) {
            console.error("Error scheduling event:", err);
            setFormError('Failed to schedule the event.');
        }
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
                        <input ref={passwordInputRef} type="password" id="admin-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
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
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="date">Date</label>
                                <input type="date" id="date" value={date} onChange={(e) => setDate(e.target.value)} min={today} required />
                            </div>
                            {/* --- REPLACED TIME INPUTS WITH DROPDOWN --- */}
                            <div className="form-group">
                                <label htmlFor="time-slot">Time Slot</label>
                                <select id="time-slot" value={timeSlot} onChange={(e) => setTimeSlot(e.target.value)} required>
                                    <option value="" disabled>-- Select --</option>
                                    <option value="FN">FN (Forenoon)</option>
                                    <option value="AN">AN (Afternoon)</option>
                                    <option value="Whole Day">Whole Day</option>
                                </select>
                            </div>
                        </div>
                        <button type="submit" className="schedule-button">Schedule Event</button>
                        {formError && <p className="error-message">{formError}</p>}
                    </form>
                </section>
                <section className="list-section">
                    <h2>Current Bookings</h2>
                    {/* The export function will need to be updated separately if needed */}
                    <div className="booking-list">
                        {bookings.length > 0 ? bookings.map(booking => (
                            <div key={booking.id} className="booking-item">
                                <div className="booking-details">
                                    <h4 className="event-name">{booking.eventName}</h4>
                                    <p className="customer-info"><strong>Customer:</strong> {booking.customerName} ({booking.customerEmail}){customerBookingCounts[booking.customerEmail] > 1 ? (<span className="tag repeat-customer">Repeat ({customerBookingCounts[booking.customerEmail]})</span>) : (<span className="tag first-time">First-time</span>)}</p>
                                    {/* --- UPDATED DISPLAY FOR TIME SLOT --- */}
                                    <p className="date-time-info"><strong>When:</strong> {booking.date} for {booking.time}</p>
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

