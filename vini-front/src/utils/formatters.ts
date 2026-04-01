export function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Price on request";
  return `${currency} ${price.toLocaleString()}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays} days ago`;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatCondition(condition: string): string {
  switch (condition) {
    case "used":
      return "Used";
    case "refurbished":
      return "Refurbished";
    case "new_old_stock":
      return "New Old Stock";
    default:
      return condition;
  }
}
