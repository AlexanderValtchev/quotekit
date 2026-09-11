// Pure demo pricing: minimum clean charge is applied before optional extras.
// Prices are fictional and require customer approval before a real installation.
(function (root) {
  'use strict';
  const defaults = { name: 'Your Cleaning Co.', rate: 1.5, multiplier: 1.6, minimum: 60, extras: { oven: 20, fridge: 15 } };
  function money(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function calculate(input, config = defaults) {
    if (!Number.isInteger(input.area) || input.area < 20 || input.area > 300) throw new Error('Enter a whole-number area between 20 and 300 m².');
    if (!['standard', 'deep'].includes(input.service)) throw new Error('Choose a supported service.');
    if (!Number.isFinite(config.rate) || config.rate <= 0 || config.rate > 100 || !Number.isFinite(config.multiplier) || config.multiplier < 1 || config.multiplier > 5 || !Number.isFinite(config.minimum) || config.minimum < 0 || config.minimum > 10000) throw new Error('Check the business rates.');
    if (!Array.isArray(input.extras)) throw new Error('Choose supported extras.');
    const extras = [...new Set(input.extras)].map(key => {
      if (!Object.prototype.hasOwnProperty.call(config.extras, key) || !Number.isFinite(config.extras[key]) || config.extras[key] < 0) throw new Error('Choose supported extras.');
      return { key, price: money(config.extras[key]) };
    });
    const base = money(input.area * config.rate * (input.service === 'deep' ? config.multiplier : 1));
    const minimumAdjustment = money(Math.max(0, config.minimum - base));
    const total = money(base + minimumAdjustment + extras.reduce((sum, extra) => sum + extra.price, 0));
    return { base, minimumAdjustment, extras, total };
  }
  const api = { defaults, calculate };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.QuoteKit = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
