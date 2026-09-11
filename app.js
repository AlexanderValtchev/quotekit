// Connects the local demo controls to the pricing model and a copyable enquiry.
// No lead is stored or sent; rates and branding reset on page reload.
// Language: Bulgarian by default, English as a second option (see i18n.js).
'use strict';
const byId = id => document.getElementById(id);
let config = { ...QuoteKit.defaults, extras: { ...QuoteKit.defaults.extras } };
const euro = value => new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(value);

let lang = QuoteKitI18n.defaultLang;
let t = QuoteKitI18n[lang];
try { const saved = localStorage.getItem('quotekit-lang'); if (saved && QuoteKitI18n[saved]) lang = saved; } catch (error) { /* storage unavailable */ }
t = QuoteKitI18n[lang];
config.name = t.defaultName;

// quote.js throws English messages so its unit tests stay unchanged; map them for display.
const errorKeyByEnglish = Object.fromEntries(Object.entries(QuoteKitI18n.en.errors).map(([key, text]) => [text, key]));
const localizeError = message => {
  const key = errorKeyByEnglish[message];
  return key ? t.errors[key] : message;
};
const labels = () => ({ oven: t.oven, fridge: t.fridge });

function applyLanguage(next) {
  lang = QuoteKitI18n[next] ? next : QuoteKitI18n.defaultLang;
  const previous = t;
  t = QuoteKitI18n[lang];
  try { localStorage.setItem('quotekit-lang', lang); } catch (error) { /* storage unavailable */ }
  document.documentElement.lang = t.lang;
  document.title = t.title;
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t[el.dataset.i18n]; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { el.innerHTML = t[el.dataset.i18nHtml]; });
  document.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t[el.dataset.i18nAria]); });
  document.querySelectorAll('.lang button').forEach(button => button.classList.toggle('on', button.dataset.lang === lang));
  // Only swap the example business name while it is still the untouched default.
  if (byId('name').value.trim() === previous.defaultName) { byId('name').value = t.defaultName; config.name = t.defaultName; }
  render();
}

function render() {
  const input = { area: Number(byId('area').value), service: document.querySelector('input[name=service]:checked').value, extras: [...document.querySelectorAll('input[name=extras]:checked')].map(el => el.value) };
  const breakdown = byId('breakdown');
  breakdown.replaceChildren();
  try {
    const quote = QuoteKit.calculate(input, config);
    byId('total').textContent = euro(quote.total);
    byId('business-name').textContent = config.name;
    byId('copy').disabled = false;
    byId('copy-status').textContent = t.copyIdle;
    const rows = [[`${input.service === 'deep' ? t.rowDeep : t.rowStandard} · ${input.area} ${t.unit}`, quote.base]];
    if (quote.minimumAdjustment) rows.push([t.rowMinimum, quote.minimumAdjustment]);
    quote.extras.forEach(extra => rows.push([labels()[extra.key], extra.price]));
    rows.forEach(([label, price]) => {
      const row = document.createElement('div');
      const name = document.createElement('span'); const amount = document.createElement('span');
      name.textContent = label; amount.textContent = euro(price); row.append(name, amount); breakdown.append(row);
    });
    byId('enquiry').value = t.enquiry(config.name, rows.map(([label, price]) => `${label}: ${euro(price)}`).join('\n'), euro(quote.total));
    Object.keys(labels()).forEach(key => { byId(`${key}-price`).textContent = `+ ${euro(config.extras[key])}`; });
  } catch (error) {
    byId('total').textContent = '—'; byId('copy-status').textContent = localizeError(error.message);
    byId('enquiry').value = ''; byId('copy').disabled = true;
  }
}
document.querySelectorAll('.lang button').forEach(button => button.addEventListener('click', () => applyLanguage(button.dataset.lang)));
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
    if (!candidate.name) throw new Error(QuoteKitI18n.en.errors.name);
    QuoteKit.calculate({ area: 70, service: 'standard', extras: [] }, candidate);
    config = candidate; render(); byId('owner-status').textContent = t.ownerDone;
  } catch (error) { byId('owner-status').textContent = localizeError(error.message); }
});
byId('copy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(byId('enquiry').value);
    byId('copy-status').textContent = t.copyDone;
  } catch {
    byId('enquiry').parentElement.open = true; byId('enquiry').focus(); byId('enquiry').select();
    byId('copy-status').textContent = t.copyFallback;
  }
});
applyLanguage(lang);
