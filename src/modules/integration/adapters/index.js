const genericAdapter = require('./generic.adapter');

const adapterRegistry = {
  generic: genericAdapter
};

const getIntegrationAdapter = (adapterKey) => {
  if (!adapterKey) return genericAdapter;
  return adapterRegistry[adapterKey] || genericAdapter;
};

module.exports = {
  getIntegrationAdapter
};
