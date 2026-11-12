# Megito Foods website (React + Vite)

```
npm install
npm run dev      # local preview
npm run build    # production build in dist/
```

## Deploy (Nixpacks: Coolify, Railway, etc.)
`nixpacks.toml` runs `npm run build`, then `node server.js` serves the site from `dist/`.
Keep `package.json` at the **root** of the repo (or set the host's Base Directory to the folder that holds it), and expose port `3000` (or let the host set `PORT`).

## Structure
- `src/data/products.js`: the product catalogue. Each product has `id`, `name`, `category`, `description`, `image`, `alt`, `illustrative`, `packSize`, `sellingUnit`, `price`, `availability` and `variations[]`. Each variation has its own `price`, `sellingUnit` and `packSize`. When the price document arrives, fill these fields in. Cards switch from "Request current pricing" to the price automatically.
- `src/App.jsx`: pages (Home, Products, Business supply, About, Contact), search, category filters, variation selection and the enquiry form.
- `src/styles.css`: design tokens and responsive rules (mobile menu under 1024px).
- `public/assets/`: photos, logo and the illustrative product images (original PNGs kept).

## Quote builder
- `src/QuoteBuilder.jsx` handles products, pack quantities, one-off or repeat orders, address search and the delivery estimate.
- Delivery = base fee + rate per km (driving distance from 43 Diya Street) + rate per kg. Rates and the minimum order are in `RATES` at the top of the file.
- Address search uses OpenStreetMap (Nominatim) and driving distance uses OSRM. No API key needed. For high traffic, host your own Nominatim/OSRM or use a paid provider, as the public servers have usage limits.
- Customers get a quote reference and can send the quote on WhatsApp (+234 803 789 8104), by email, or save it as a PDF.

## Before launch
- Connect the enquiry form to a submission service. Until then it opens a prefilled email.
- Add real photos for products showing "Photo coming soon".
- Confirm the map pin for 43 Diya Street, Ifako, Gbagada.
- Confirm whether snails are in the current range (`SHOW_SNAILS` in `App.jsx`).
- Prices come from the supplied price list (VAT exclusive). Edit `sizes` in `src/data/products.js` when prices change.
