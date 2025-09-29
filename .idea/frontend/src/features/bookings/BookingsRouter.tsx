// src/features/bookings/BookingsRouter.tsx
import { useAuth } from "../../store/AuthContext";
import BookingsList from "./BookingsList";
import ServiceAdvisorBookings from "./ServiceAdvisorBookings";

export default function BookingsRouter() {
  const { user } = useAuth();

  // Service advisors get their specialized dashboard
  if (user?.role === "service_advisor") {
    return <ServiceAdvisorBookings />;
  }

  // All other roles get the regular bookings list
  return <BookingsList />;
}