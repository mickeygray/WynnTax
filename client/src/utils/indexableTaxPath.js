// Routes served as prerendered directories by the current web server.
const directoryRoute = /^\/(?:tax-news|tax-relief|tax-resolution|tax-negotiation|tax-protection-plans|state-tax-guide)(?:\/[a-z0-9-]+)?\/?$/;

function canonicalTaxPath(value) {
  return directoryRoute.test(value) ? value.replace(/\/$/, "") + "/" : value;
}

module.exports = { canonicalTaxPath, directoryRoute };