import NotificationsProvider from './notifications/NotificationsProvider';
import Notifications from './pages/Notifications';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import RequireRole from './components/RequireRole';
import AuthProvider from './auth/AuthProvider';
import CreateEvent from './pages/CreateEvent';
import EditEvent from './pages/EditEvent';
import EventDetails from './pages/EventDetails';
import Events from './pages/Events';
import Home from './pages/Home';
import AuthPage from './pages/AuthPage';

export default function App() {
  return <BrowserRouter><AuthProvider><NotificationsProvider><Navbar /><Routes>
    <Route path="/" element={<Home />} />
    <Route path="/events" element={<Events />} />
    <Route path="/events/:id" element={<EventDetails />} />
    <Route path="/events/:id/edit" element={<RequireRole role="organizer"><EditEvent /></RequireRole>} />
    <Route path="/create" element={<RequireRole role="organizer"><CreateEvent /></RequireRole>} />
    <Route path="/bookings" element={<RequireRole role="attendee"><Events key="bookings" bookings /></RequireRole>} />
    <Route path="/notifications" element={<Notifications />} />
    <Route path="/auth" element={<AuthPage />} />
    <Route path="*" element={<main className="page"><h1>Page not found</h1></main>} />
  </Routes></NotificationsProvider></AuthProvider></BrowserRouter>;
}
