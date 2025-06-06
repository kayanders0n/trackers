// === Format Length to Hours/Minutes ===
function formatLength(minutes) {
  if (!minutes || isNaN(minutes)) return "";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

// === Column Sorting ===
let currentSort = {
  column: null,
  direction: 'asc',
};