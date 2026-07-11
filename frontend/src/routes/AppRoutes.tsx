import { Routes, Route, Navigate } from 'react-router-dom'

// Public
import Home from '../pages/public/Home'
import SearchResults from '../pages/public/SearchResults'
import ParkingDetail from '../pages/public/ParkingDetail'
import Pricing from '../pages/public/Pricing'
import CitiesDirectory from '../pages/public/CitiesDirectory'
import CityParking from '../pages/public/CityParking'
import AboutUs from '../pages/AboutUs'
import TermsOfService from '../pages/TermsOfService'
import PrivacyPolicy from '../pages/PrivacyPolicy'
import NotFound from '../pages/NotFound'

// Auth
import Login from '../pages/auth/Login'
import Signup from '../pages/auth/Signup'
import ForgotPassword from '../pages/auth/ForgotPassword'
import ResetPassword from '../pages/auth/ResetPassword'
import VerifyEmail from '../pages/auth/VerifyEmail'

// Layouts
import OwnerLayout from '../components/layout/OwnerLayout'
import UserLayout from '../components/layout/UserLayout'
import AdminLayout from '../components/layout/AdminLayout'
import ProtectedRoute from '../components/auth/ProtectedRoute'

// Owner pages
import OwnerDashboard from '../pages/owner/OwnerDashboard'
import OwnerListings from '../pages/owner/OwnerListings'
import OwnerBookings from '../pages/owner/OwnerBookings'
import OwnerEarnings from '../pages/owner/OwnerEarnings'
import OwnerReviews from '../pages/owner/OwnerReviews'
import OwnerSubscription from '../pages/owner/OwnerSubscription'
import OwnerSettings from '../pages/owner/OwnerSettings'
import ParkingForm from '../pages/owner/ParkingForm'
import AddLocation from '../pages/owner/AddLocation'
import LocationDetail from '../pages/owner/LocationDetail'

// Booking flow
import BookingFlow from '../pages/public/BookingFlow'
import PaymentPage from '../pages/public/PaymentPage'
import BookingConfirmation from '../pages/public/BookingConfirmation'

// User portal pages
import UserDashboard from '../pages/user/UserDashboard'
import MyBookings from '../pages/user/MyBookings'
import UserVehicles from '../pages/user/UserVehicles'
import UserProfile from '../pages/user/UserProfile'
import Support from '../pages/user/Support'
import FindParking from '../pages/user/FindParking'
import Favorites from '../pages/user/Favorites'

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard'
import AdminUsers from '../pages/admin/AdminUsers'
import AdminOwners from '../pages/admin/AdminOwners'
import AdminBookings from '../pages/admin/AdminBookings'
import AdminLocations from '../pages/admin/AdminLocations'
import PendingApprovals from '../pages/admin/PendingApprovals'
import AdminSupport from '../pages/admin/AdminSupport'
import AdminPayouts from '../pages/admin/AdminPayouts'
import AdminReviews from '../pages/admin/AdminReviews'
import AdminAuditLog from '../pages/admin/AdminAuditLog'
import AdminReports from '../pages/admin/AdminReports'
import ConfigurationLayout from '../pages/admin/configuration/ConfigurationLayout'
import ProfileTab from '../pages/admin/configuration/ProfileTab'
import BrandingTab from '../pages/admin/configuration/BrandingTab'
import CommissionTab from '../pages/admin/configuration/CommissionTab'
import ListingPolicyTab from '../pages/admin/configuration/ListingPolicyTab'
import SupportTab from '../pages/admin/configuration/SupportTab'
import AmenitiesTab from '../pages/admin/configuration/AmenitiesTab'
import ParkingTypesTab from '../pages/admin/configuration/ParkingTypesTab'
import SubscriptionPlansTab from '../pages/admin/configuration/SubscriptionPlansTab'

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<AboutUs />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/parking-in" element={<CitiesDirectory />} />
      <Route path="/parking-in/:citySlug" element={<CityParking />} />
      <Route path="/parking/:id" element={<ParkingDetail />} />

      {/* Booking flow — driver-only, calls authenticated /user endpoints on mount */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route path="/booking" element={<BookingFlow />} />
        <Route path="/booking/payment" element={<PaymentPage />} />
        <Route path="/booking/confirmation" element={<BookingConfirmation />} />
      </Route>

      {/* Owner portal */}
      <Route element={<ProtectedRoute role="owner" />}>
        <Route path="/owner" element={<OwnerLayout />}>
          <Route index element={<OwnerDashboard />} />
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="locations" element={<OwnerListings />} />
          <Route path="locations/new" element={<AddLocation />} />
          <Route path="locations/:id/members" element={<LocationDetail />} />
          <Route path="parkings/:id/edit" element={<ParkingForm />} />
          <Route path="bookings" element={<OwnerBookings />} />
          <Route path="earnings" element={<OwnerEarnings />} />
          <Route path="reviews" element={<OwnerReviews />} />
          <Route path="subscription" element={<OwnerSubscription />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>
      </Route>

      {/* User portal — includes Find Parking / My Bookings / Support / Favorites, kept at top-level paths per spec */}
      <Route element={<ProtectedRoute role="user" />}>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<UserDashboard />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="vehicles" element={<UserVehicles />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>
        <Route path="/find-parking" element={<UserLayout />}>
          <Route index element={<FindParking />} />
        </Route>
        <Route path="/favorites" element={<UserLayout />}>
          <Route index element={<Favorites />} />
        </Route>
        <Route path="/bookings" element={<UserLayout />}>
          <Route index element={<MyBookings />} />
        </Route>
        <Route path="/support" element={<UserLayout />}>
          <Route index element={<Support />} />
        </Route>
      </Route>

      {/* Admin portal */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="owners" element={<AdminOwners />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="locations" element={<AdminLocations />} />
          <Route path="locations/pending" element={<PendingApprovals />} />
          <Route path="support" element={<AdminSupport />} />
          <Route path="payouts" element={<AdminPayouts />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="audit-log" element={<AdminAuditLog />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<Navigate to="/admin/configuration/profile" replace />} />
          <Route path="configuration" element={<ConfigurationLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="profile" element={<ProfileTab />} />
            <Route path="branding" element={<BrandingTab />} />
            <Route path="commission" element={<CommissionTab />} />
            <Route path="listing-policy" element={<ListingPolicyTab />} />
            <Route path="support" element={<SupportTab />} />
            <Route path="amenities" element={<AmenitiesTab />} />
            <Route path="parking-types" element={<ParkingTypesTab />} />
            <Route path="subscription-plans" element={<SubscriptionPlansTab />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
