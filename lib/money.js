export function money(cents) {
  return 'R$ ' + (cents / 100).toFixed(2).replace('.', ',');
}
