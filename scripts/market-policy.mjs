/** Evidence policy: archived reference data is never presented as a live market. */
export function checkMarketEvidence({verified, status = 'live', notice = '', now = Date.now()}) {
  const errors = [];
  const date = new Date(`${verified}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(verified || '') || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== verified) {
    return ['missing or invalid market verification date'];
  }
  const age = Math.floor((now - date.getTime()) / 86400000);
  if (age < -1) errors.push('market verification date is in the future');
  if (!['live', 'archived'].includes(status)) errors.push(`unknown market status: ${status}`);
  if (status === 'archived') {
    if (!/archiv|historical/i.test(notice) || !/2026|20\d{2}/.test(notice) || !/current|quote|offer/i.test(notice)) {
      errors.push('archived market data needs a visible dated notice explaining it is not current pricing');
    }
  } else if (age > 45) {
    errors.push(`live market data is ${age} days old (limit: 45)`);
  }
  return errors;
}
