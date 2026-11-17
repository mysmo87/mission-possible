# Mission Possible Contact Hub

Live page: https://mysmo87.github.io/mission-possible/

## Files
- `index.html` - page layout, styles and behaviour (no need to edit for contact changes)
- `config.js` - all contact data (the only file you edit)
- `qr-assets/` - QR codes pointing to the live page

## Updating contacts
1. Open `config.js`.
2. In the `experts` list, add, remove or reorder lines like:
   `{ name: "Full Name", email: "first.last@sas.com", region: "", publish: true },`
3. To hide someone without deleting them, set `publish: false`.
4. Optional: set `region` to `"americas"`, `"emea"` or `"apac"`. Region filter buttons appear automatically once anyone has a region.
5. Commit the change to the `main` branch (you can edit `config.js` directly on github.com). GitHub Pages republishes within a minute or two, at the same address.

The QR code never needs to change: the address stays the same.

## Notes
- Static page, no backend, no database, no tracking, no secrets.
- Initials circles are generated automatically from each name.
- Only publish emails that the person has approved.
