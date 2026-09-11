// Connects the local demo controls to the pricing model and a copyable enquiry.
// No lead is stored or sent; rates and branding reset on page reload.
'use strict';
const byId = id => document.getElementById(id);
let config = { ...QuoteKit.defaults, extras: { ...QuoteKit.defaults.extras } };
const euro = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);
const labels = { oven: 'Inside the oven', fridge: 'Inside the fridge' };
function render() {
  const input = { area: Number(byId('area').value), service: document.querySelector('input[name=service]:checked').value, extras: [...document.querySelectorAll('input[name=extras]:checked')].map(el => el.value) };
  const breakdown = byId('breakdown');
  breakdown.replaceChildren();
  try {
    const quote = QuoteKit.calculate(input, config);
    byId('total').textContent = euro(quote.total);
    byId('business-name').textContent = config.name;
    byId('copy').disabled = false;
    byId('copy-status').textContent = 'Demo prices only. Nothing is sent automatically.';
    const rows = [[`${input.service === 'deep' ? 'Deep' : 'Standard'} clean · ${input.area} m²`, quote.base]];
    if (quote.minimumAdjustment) rows.push(['Minimum charge adjustment', quote.minimumAdjustment]);
    quote.extras.forEach(extra => rows.push([labels[extra.key], extra.price]));
    rows.forEach(([label, price]) => {
      const row = document.createElement('div');
      const name = document.createElement('span'); const amount = document.createElement('span');
      name.textContent = label; amount.textContent = euro(price); row.append(name, amount); breakdown.append(row);
    });
    byId('enquiry').value = `Hello ${config.name},\nPlease confirm availability and the final price for:\n${rows.map(([label, price]) => `${label}: ${euro(price)}`).join('\n')}\nEstimated total: ${euro(quote.total)}\n\nPreferred date: [add date]\nArea/neighbourhood: [add area]\n\nThis is an indicative estimate, not a confirmed booking.`;
    Object.keys(labels).forEach(key => { byId(`${key}-price`).textContent = `+ ${euro(config.extras[key])}`; });
  } catch (error) {
    byId('total').textContent = '—'; byId('copy-status').textContent = error.message;
    byId('enquiry').value = ''; byId('copy').disabled = true;
  }
}
byId('quote-form').addEventListener('submit', event => event.preventDefault());
byId('quote-form').addEventListener('input', event => {
  if (event.target.id === 'area-slider') byId('area').value = event.target.value;
  if (event.target.id === 'area' && event.target.validity.valid) byId('area-slider').value = event.target.value;
  render();
});
byId('owner-form').addEventListener('submit', event => {
  event.preventDefault();
  const candidate = { ...config, name: byId('name').value.trim(), rate: Number(byId('rate').value), multiplier: Number(byId('multiplier').value), minimum: Number(byId('minimum').value) };
  try {
    if (!candidate.name) throw new Error('Enter a business name.');
    QuoteKit.calculate({ area: 70, service: 'standard', extras: [] }, candidate);
    config = candidate; render(); byId('owner-status').textContent = 'Example updated. These rates reset when you reload.';
  } catch (error) { byId('owner-status').textContent = error.message; }
});
byId('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('enquiry').value);
    byId('copy-status').textContent = 'Copied. Paste it into a message and add your preferred date and area.';
  } catch {
    byId('enquiry').parentElement.open = true; byId('enquiry').focus(); byId('enquiry').select();
    byId('copy-status').textContent = 'Select and copy the enquiry below. Clipboard access is unavailable here.';
  }
});
render();
