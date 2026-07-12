# Pricelist Conversion App

A local web app for entering pricelist headers and product entries with smart name parsing, auto-calculated selling prices, and Excel export.

## Features

- **Header fields**: Size (mm), Size (Ft), Pce/Box, Sqft in Box (Original/Billed), Weight, SP Unit
- **Product entries**: Name, Collection, Surface, EX-Factory, MRP/Sqft, Selling Price/Sqft
- **Smart name parsing**:
  - `SPECTRA (Cheese, Mushroom, Peanut, Pepper)` → Spectra Cheese, Spectra Mushroom, etc.
  - `BRAIDS (Ash, Dove) OBLIQUE (Beach, Khaki)` → Braids Ash, Braids Dove, Oblique Beach, Oblique Khaki
  - Comma-separated names → individual products
- **Auto selling price**: `round(MRP × 0.65)` — editable with reset to formula
- **Local SQLite database** stored at `server/data/pricelist.db`
- **Excel export**: one row per parsed product

## Requirements

- Node.js 18+

## Setup & Run

```bash
# Install all dependencies
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# Start both server and client
npm run dev
```

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3001

## Usage

1. Fill in the header fields at the top
2. Add product entries with Name, Collection, Surface, etc.
3. Watch the live parse preview under each Name field
4. Click **Save** to persist to the local database
5. Click **Export Current** or **Export All** to download Excel

## Name Parsing Examples

| Input | Result |
|-------|--------|
| `SPECTRA (Cheese, Mushroom, Peanut, Pepper)` | Spectra Cheese, Spectra Mushroom, Spectra Peanut, Spectra Pepper |
| `Bardiglo Rift, Bruno Rainforest, Dover Perla` | Bardiglo Rift, Bruno Rainforest, Dover Perla |
| `BRAIDS (Ash, Dove) OBLIQUE (Beach, Khaki)` | Braids Ash, Braids Dove, Oblique Beach, Oblique Khaki |
