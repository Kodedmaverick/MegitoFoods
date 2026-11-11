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

## Before launch
- Connect the enquiry form to a submission service. Until then it opens a prefilled email.
- Add real photos for chicken wings, breast, whole chicken, croaker, mackerel, Kote and hake. These products show "Photo coming soon".
- Confirm the map pin for 15 Diya Street, Gbagada.
- Confirm whether snails are in the current range (`SHOW_SNAILS` in `App.jsx`).
- Add prices, selling units and pack sizes from the price document.
