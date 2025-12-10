# Home Portal

A landing page for the Reactive Platform that provides quick access to all platform applications.

## Overview

The Home Portal serves as the entry point to the Reactive Platform ecosystem, providing:

- Visual directory of all platform applications
- Status indicators for active vs. coming soon apps
- Responsive grid layout for easy navigation
- Search functionality (placeholder)
- Authentication integration (placeholder)

## Features

### Header
- Platform branding with logo and title
- Search bar for finding applications (currently non-functional placeholder)
- Login/Logout button (currently placeholder)

### Application Cards Grid
- Responsive grid layout (4 columns on desktop, 2 on tablet, 1 on mobile)
- Each card displays:
  - Icon/emoji representation
  - Application title
  - Brief description
  - Status badge (Active or Coming Soon)
- Interactive hover effects for active applications
- Toast notifications for coming soon applications

### Available Applications

**Active Applications:**
1. **E-commerce Web** (http://localhost:3001) - Online shopping experience
2. **Self-Checkout Kiosk** (http://localhost:3002) - In-store self-service checkout

**Coming Soon:**
3. POS System - Full-featured point of sale
4. Offline POS - Works without internet connection
5. Merchant Portal - Manage your store and inventory
6. Delivery Portal - Track and manage deliveries
7. Admin Portal - Platform administration
8. Mobile E-commerce - Shop on the go
9. Mobile POS - Portable point of sale

## Development

### Start Development Server

```bash
# Using Nx
pnpm nx serve home-portal

# Or directly
pnpm nx dev home-portal
```

The app will be available at http://localhost:3003

### Build for Production

```bash
pnpm nx build home-portal
```

Built files will be in `dist/apps/home-portal/`

### Run Tests

```bash
pnpm nx test home-portal
```

## Architecture

### Project Structure

```
apps/home-portal/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── Header.tsx         # Top navigation header
│   │   │   ├── AppCard.tsx        # Application card component
│   │   │   └── Toast.tsx          # Toast notification component
│   │   ├── hooks/
│   │   │   └── useToast.tsx       # Toast notification hook
│   │   ├── types.ts               # Application data types
│   │   └── app.tsx                # Main app component
│   ├── styles.css                 # Global styles with Tailwind
│   ├── main.tsx                   # Application entry point
│   └── test/
│       └── setup.ts               # Test configuration
├── public/                        # Static assets
├── index.html                     # HTML template
├── vite.config.mts                # Vite configuration
├── tailwind.config.ts             # Tailwind CSS configuration
├── tsconfig.json                  # TypeScript configuration
└── project.json                   # Nx project configuration

```

### Technology Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first styling
- **Design Tokens** - Shared design system from `@reactive-platform/shared-design-tokens`
- **UI Components** - Shared components from `@reactive-platform/shared-ui/ui-components`

### Key Components

#### Header
- Platform branding
- Search bar (placeholder)
- Login button (placeholder)

#### AppCard
- Displays application information
- Handles click events based on status
- Visual feedback on hover
- Status badge

#### Toast System
- `useToast` hook for managing notifications
- `Toast` component for individual notifications
- `ToastContainer` for positioning and displaying toasts
- Auto-dismiss after 3 seconds

## Adding New Applications

To add a new application to the portal:

1. Edit `/src/app/types.ts`
2. Add a new entry to the `applications` array:

```typescript
{
  id: 'new-app',
  title: 'New Application',
  description: 'Description of the application',
  url: 'http://localhost:3004', // or '#' for coming soon
  status: 'active', // or 'coming-soon'
  icon: '📱', // Choose an appropriate emoji
}
```

3. The card will automatically appear in the grid

## Future Enhancements

- Implement functional search
- Add authentication integration
- User preferences and favorites
- Application health status indicators
- Recent applications tracking
- Application categories/filtering
- Dark mode toggle
- Application usage analytics

## Port Configuration

This app runs on port **3003** by default. Configuration is in `vite.config.mts`:

```typescript
server: {
  port: 3003,
  host: 'localhost',
}
```
