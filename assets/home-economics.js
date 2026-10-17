/* Illustrative rental arithmetic; this rate is not market data. */
(function () {
  'use strict';
  const control = document.getElementById('home-utilization');
  const grid = document.getElementById('util-grid');
  if (!control || !grid) return;
  const rentalHours = 8 * 24 * 30;
  const cells = Array.from({ length: 100 }, () => {
    const cell = document.createElement('span');
    cell.setAttribute('aria-hidden', 'true');
    grid.appendChild(cell);
    return cell;
  });
  function render() {
    const percent = Number(control.value);
    const productiveHours = rentalHours * percent / 100;
    const cost = rentalHours * 3 / productiveHours;
    document.getElementById('util-percent').textContent = `${percent}%`;
    document.getElementById('util-cost').textContent = `$${cost.toFixed(2)}`;
    document.getElementById('util-equation').textContent = `$17,280 ÷ ${productiveHours.toLocaleString('en-US', { maximumFractionDigits: 1 })} productive GPU-hours = $${cost.toFixed(2)}`;
    grid.setAttribute('aria-label', `${percent} of 100 units of billed capacity-time are productive; ${100 - percent} are idle.`);
    cells.forEach((cell, i) => cell.classList.toggle('is-productive', i < percent));
  }
  control.addEventListener('input', render);
  render();
})();
