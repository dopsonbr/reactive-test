# Image Assets for POS System User Guide

This folder contains placeholder wireframes for the POS System user guide. Replace these with actual screenshots when the application is ready.

## Required Images

### Getting Started
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `pos-overview-wireframe.png` | Full POS interface overview | 1200x800 |
| `login-screen-wireframe.png` | Login page | 800x600 |
| `register-select-wireframe.png` | Register selection | 600x400 |
| `sidebar-wireframe.png` | Sidebar navigation | 300x600 |
| `dashboard-wireframe.png` | Dashboard/home screen | 1200x800 |
| `settings-wireframe.png` | User settings panel | 600x500 |

### Transaction Basics
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `new-transaction-wireframe.png` | New transaction screen | 1200x800 |
| `scanning-item-wireframe.png` | Scanning product demonstration | 600x400 |
| `product-search-wireframe.png` | Product search dialog | 700x500 |
| `cart-panel-pos-wireframe.png` | Cart panel with items | 400x600 |
| `item-details-pos-wireframe.png` | Item detail view | 500x600 |

### Customer Lookup
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `customer-search-wireframe.png` | Customer search dialog | 700x500 |
| `customer-quickview-wireframe.png` | Customer quick view panel | 400x600 |

### Fulfillment Options
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `pickup-config-wireframe.png` | Pickup configuration | 700x500 |
| `delivery-config-wireframe.png` | Delivery configuration | 700x600 |
| `multi-fulfillment-wireframe.png` | Multi-fulfillment setup | 800x600 |

### Payment Processing
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `payment-screen-pos-wireframe.png` | Payment method selection | 1000x700 |

### Markdowns & Discounts
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `markdown-dialog-wireframe.png` | Markdown application dialog | 600x500 |

### Customer Management
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `customer-profile-wireframe.png` | Full customer profile | 1200x800 |

### Order Management
| Filename | Description | Dimensions |
|----------|-------------|------------|
| `order-details-wireframe.png` | Order details view | 1000x800 |

## Image Guidelines

### Format
- Use PNG format for all screenshots
- Optimize for web (compress without quality loss)
- Use 2x resolution for retina displays

### Style
- Capture full screens or meaningful sections
- Use consistent cropping and margins
- Highlight key elements with annotations where helpful
- Blur any test data that looks like real customer/employee information

### Naming Convention
- Use lowercase with hyphens
- End with `-wireframe` while in placeholder state
- Remove `-wireframe` suffix when replaced with actual screenshots

### Annotations
- Use red (#EF4444) for important callouts
- Use blue (#3B82F6) for informational highlights
- Use arrows to point to specific UI elements
- Keep annotations minimal and clear

## Placeholder Template

Use SVG placeholders during development:

```svg
<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f4f6"/>
  <rect x="20" y="20" width="760" height="560" rx="8" fill="#e5e7eb" stroke="#d1d5db" stroke-width="2"/>
  <text x="400" y="280" font-family="system-ui, sans-serif" font-size="24" fill="#6b7280" text-anchor="middle">
    [Screen Name]
  </text>
  <text x="400" y="320" font-family="system-ui, sans-serif" font-size="16" fill="#9ca3af" text-anchor="middle">
    Replace with actual screenshot
  </text>
</svg>
```

## Replacing Placeholders

When the POS application is ready:

1. Take screenshots from the actual application
2. Crop and resize to recommended dimensions
3. Add annotations where helpful
4. Rename without the `-wireframe` suffix
5. Update markdown files if image names changed
6. Delete placeholder SVG files
