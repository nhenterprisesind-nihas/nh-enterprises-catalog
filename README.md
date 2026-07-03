# Premium Product Catalog — Google Sheets Powered

A luxury maroon & gold themed product catalog built with Next.js (App Router). Fetches product data from a Google Sheet and supports 3-tier pricing (MRP, Retail, Wholesale) with WhatsApp ordering.

## Features

- 📊 **Google Sheets as CMS** — Update products by editing a spreadsheet
- 💰 **3-Tier Pricing** — MRP, Retail, and Wholesale prices
- 🛒 **Smart Cart** — Enforces MOQ (Minimum Order Quantity) of 10 for wholesale
- 📱 **WhatsApp Ordering** — One-click order submission via WhatsApp
- 🎨 **Luxury Theme** — Maroon & gold responsive design
- 🔍 **Search & Filter** — By category and product name
- 📱 **Mobile Responsive** — Looks great on all devices

## Google Sheet Setup

### Step 1: Create the Sheet

Create a new Google Sheet with these **exact column headers** in Row 1:

| name | description | category | mrp | retail_price | wholesale_price | image_url | stock |
|------|-------------|----------|-----|-------------|-----------------|-----------|-------|
| Premium Silk Saree | Handwoven Banarasi silk | Clothing | 12999 | 9999 | 7499 | https://... | 25 |
| Organic Turmeric | 100% pure lakadong | Groceries | 599 | 449 | 349 | https://... | 150 |

### Column Descriptions:

| Column | Type | Description |
|--------|------|-------------|
| `name` | Text | Product name (required) |
| `description` | Text | Short product description |
| `category` | Text | Category for filtering (e.g., Clothing, Groceries) |
| `mrp` | Number | Maximum Retail Price in ₹ |
| `retail_price` | Number | Retail/discounted price in ₹ |
| `wholesale_price` | Number | Wholesale/bulk price in ₹ |
| `image_url` | URL | Direct link to product image |
| `stock` | Number | Available stock quantity (0 = Out of Stock) |

### Step 2: Publish as CSV

1. Open your Google Sheet
2. Go to **File → Share → Publish to web**
3. Select the sheet tab containing your products
4. Choose **Comma-separated values (.csv)** as the format
5. Click **Publish**
6. Copy the generated URL

### Step 3: Configure Environment

Create a `.env.local` file:

```env
NEXT_PUBLIC_SHEET_URL=https://docs.google.com/spreadsheets/d/e/2PACX-YOUR-ID/pub?output=csv
NEXT_PUBLIC_WHATSAPP_NUMBER=919876543210
```

> **Note:** The WhatsApp number should be in international format without the `+` sign.
> Example: India number 98765 43210 → `919876543210`

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Deploy to Vercel

1. Push this project to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project
3. Import your GitHub repo
4. Add Environment Variables:
   - `NEXT_PUBLIC_SHEET_URL` = your published CSV URL
   - `NEXT_PUBLIC_WHATSAPP_NUMBER` = your WhatsApp number
5. Click Deploy

The app will automatically redeploy when you push changes.

## How It Works

1. **Data Fetching**: On page load, the app fetches the CSV from your published Google Sheet
2. **Parsing**: PapaParse converts CSV to JSON with proper type casting
3. **Display**: Products are rendered in a responsive grid with category filters
4. **Cart**: Users select a price tier (MRP/Retail/Wholesale) and add to cart
5. **MOQ Enforcement**: Wholesale orders automatically enforce minimum 10 units
6. **Order**: "Submit Order" generates a formatted WhatsApp message with full order details

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS with custom maroon/gold theme
- **CSV Parsing**: PapaParse
- **State Management**: React Context API
- **Deployment**: Vercel-ready

## Tips

- **Image URLs**: Use direct image links (ending in .jpg, .png, etc.). For Google Drive images, use the format: `https://drive.google.com/uc?id=FILE_ID`
- **Stock Management**: Set stock to `0` to show "Out of Stock" overlay
- **Categories**: Add any category name — filters are auto-generated
- **Price Updates**: Just edit the Google Sheet — changes appear on next page load (no rebuild needed!)
