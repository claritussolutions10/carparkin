import { BrowserRouter } from 'react-router-dom'
import { APIProvider } from '@vis.gl/react-google-maps'
import AppRoutes from './routes/AppRoutes'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

export default function App() {
  return (
    <APIProvider apiKey={MAPS_KEY}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </APIProvider>
  )
}