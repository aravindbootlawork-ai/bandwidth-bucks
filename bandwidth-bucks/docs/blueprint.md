# **App Name**: BandwidthBucks

## Core Features:

- User Authentication: Secure user sign-up, login, and logout using Firebase Authentication.
- Profile Dashboard: Display user profile information and monthly bandwidth earnings.
- Admin Panel: Role-based access control for administrative tasks.
- UPI Payouts: Allow users to request payouts via UPI, subject to a minimum payout of 50 INR and validation against total earnings.
- PayPal Payouts: Enable payout requests via PayPal, with a minimum payout of 1 USD, validated against total earnings. A tool that assesses exchange rates to enforce the 5000 INR monthly maximum.
- Earnings Management: Store, track, and update user earnings securely in Firestore.
- Real-time Payout Validation: Validate payout requests to ensure they meet minimum thresholds (50 INR via UPI, 1 USD via PayPal) and are within the monthly earnings cap (5000 INR) in real-time. Provide feedback to the user regarding requirements and validation.

## Style Guidelines:

- Primary color: Strong violet (#9400D3) for distinctiveness and to inspire user confidence.
- Background color: Light, desaturated violet (#F0E6FF).
- Accent color: Deep blue (#00008B) to highlight interactive elements and important notifications.
- Body font: 'Inter', a grotesque-style sans-serif providing a modern, neutral look suitable for the application's textual content.
- Headline font: 'Space Grotesk', a sans-serif font suited for technology-inspired or informational headers; pairing 'Space Grotesk' with 'Inter' allows a bold header with easily-read body text.
- Use clear and simple icons from a library like FontAwesome or Material Icons to represent actions and data points within the dashboard.
- Implement a clean, responsive layout using Tailwind CSS grid and flexbox to adapt seamlessly to different screen sizes.
- Incorporate subtle animations for loading states and transitions to enhance the user experience without being distracting.