export function formatCount(value) {
  return String(value).padStart(2, '0');
}

export function formatCurrency(amount) {
  return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
}

export function formatActivityDate(date) {
  return `${date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })} • just now`;
}

export function formatEntryDate(date) {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getActivityIcon(activityName) {
  const normalized = (activityName || '').toLowerCase();
  if (normalized.includes('water') || normalized.includes('irrig')) return 'water-drop';
  if (normalized.includes('soil') || normalized.includes('ph') || normalized.includes('nutrient')) return 'science';
  if (normalized.includes('pest') || normalized.includes('spray')) return 'bug-report';
  return 'agriculture';
}

export function getExpenseIcon(expenseName) {
  const normalized = (expenseName || '').toLowerCase();
  if (normalized.includes('water') || normalized.includes('irrig') || normalized.includes('diesel')) return 'water-drop';
  if (normalized.includes('labor') || normalized.includes('wage') || normalized.includes('worker')) return 'group';
  if (normalized.includes('fert') || normalized.includes('seed') || normalized.includes('pesticide')) return 'shopping-basket';
  return 'payments';
}

export function getEarningIcon(earningName) {
  const normalized = (earningName || '').toLowerCase();
  if (normalized.includes('subsidy') || normalized.includes('grant')) return 'paid';
  if (normalized.includes('straw') || normalized.includes('transport') || normalized.includes('shipping')) return 'local-shipping';
  if (normalized.includes('sale') || normalized.includes('crop') || normalized.includes('mandi')) return 'payments';
  return 'payments';
}

