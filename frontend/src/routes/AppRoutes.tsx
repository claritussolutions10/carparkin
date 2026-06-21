import { Routes, Route } from 'react-router-dom'
import Login from '../pages/auth/Login'
import Signup from '../pages/auth/Signup'
import Home from '../pages/user/Home'
import SearchResults from '../pages/user/SearchResults'
import ParkingDetail from '../pages/user/ParkingDetail'
import OwnerDashboard from '../pages/owner/OwnerDashboard'
import ParkingForm from '../pages/owner/ParkingForm'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/search" element={<SearchResults />} />
      <Route path="/parking/:id" element={<ParkingDetail />} />
      <Route path="/owner/dashboard" element={<OwnerDashboard />} />
      <Route path="/owner/parkings/new" element={<ParkingForm />} />
      <Route path="/owner/parkings/:id/edit" element={<ParkingForm />} />
    </Routes>
  )
}
