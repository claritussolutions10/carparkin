import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Carparkin.in API',
      version: '1.0.0',
      description: 'Monthly parking marketplace — API documentation',
    },
    servers: [
      { url: 'http://localhost:5000', description: 'Development' },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Paste the token returned from POST /api/auth/login',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'drv_01arh2xj41rj5ebg7qvc32ey43' },
            email: { type: 'string', example: 'user@carparkin.com' },
            full_name: { type: 'string', example: 'John Doe' },
            phone_number: { type: 'string', example: '+919876543212' },
            role: { type: 'string', enum: ['user', 'owner', 'admin'] },
            is_active: { type: 'boolean' },
            is_email_verified: { type: 'boolean' },
          },
        },
        ParkingType: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Basement' },
            description: { type: 'string', example: 'Underground parking' },
            is_active: { type: 'boolean' },
          },
        },
        Amenity: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: '24/7 Surveillance' },
            description: { type: 'string', example: 'CCTV monitoring 24 hours' },
            icon: { type: 'string', example: '📹' },
            is_active: { type: 'boolean' },
          },
        },
        ParkingListing: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'lst_01arh2xj41rj5ebg7qvc32ey44' },
            owner_id: { type: 'string', example: 'own_01arh2xj41rj5ebg7qvc32ey42' },
            title: { type: 'string', example: 'Downtown Secure Parking' },
            description: { type: 'string' },
            address: { type: 'string', example: '123 Main Street, Downtown' },
            latitude: { type: 'number', example: 28.7041 },
            longitude: { type: 'number', example: 77.1025 },
            total_spaces: { type: 'integer', example: 20 },
            available_spaces: { type: 'integer', example: 18 },
            price_per_month: { type: 'number', example: 3000 },
            price_per_week: { type: 'number', example: 800 },
            price_per_day: { type: 'number', example: 150 },
            has_cctv: { type: 'boolean' },
            has_security_guard: { type: 'boolean' },
            access_type: { type: 'string', example: '24/7' },
            rating: { type: 'number', example: 5.0 },
            review_count: { type: 'integer', example: 1 },
            parking_type: { type: 'string', example: 'Basement' },
            owner_name: { type: 'string', example: 'Parking Owner' },
            amenities: { type: 'array', items: { type: 'object' } },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'vhc_01arh2xj41rj5ebg7qvc32ey46' },
            vehicle_type: { type: 'string', example: 'car' },
            registration_number: { type: 'string', example: 'DL-01-AB-1234' },
            make: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Camry' },
            color: { type: 'string', example: 'Silver' },
            year_manufactured: { type: 'integer', example: 2022 },
            is_primary: { type: 'boolean' },
          },
        },
        Booking: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'bkg_01arh2xj41rj5ebg7qvc32ey48' },
            status: { type: 'string', enum: ['pending', 'confirmed', 'completed', 'cancelled'] },
            payment_status: { type: 'string', example: 'completed' },
            total_price: { type: 'number', example: 3000 },
            booking_start_date: { type: 'string', format: 'date' },
            booking_end_date: { type: 'string', format: 'date' },
            duration_days: { type: 'integer', example: 30 },
            duration_type: { type: 'string', example: 'month' },
            listing_title: { type: 'string' },
            listing_address: { type: 'string' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string', example: 'Something went wrong' },
          },
        },
      },
    },
    tags: [
      { name: 'Auth', description: 'Register and login' },
      { name: 'Parkings', description: 'Search and browse listings (public)' },
      { name: 'Owner — Listings', description: 'Create and manage your listings' },
      { name: 'Owner — Dashboard', description: 'Dashboard, earnings, subscription' },
      { name: 'User', description: 'Bookings, vehicles, profile' },
      { name: 'Subscriptions', description: 'Plans, activate, cancel, history' },
      { name: 'Bookings', description: 'Availability, pricing, create, confirm, complete' },
      { name: 'Payments (Test)', description: 'Mock payment endpoints — replace with Razorpay in production' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
