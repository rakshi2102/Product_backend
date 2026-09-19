/**
 * RateRule Model schema & helper functions
 */
class RateRule {
  constructor(data) {
    this.id = data.id || `RR-${Date.now()}`;
    this.name = data.name || 'Unnamed Rate Rule';
    this.productCategory = data.productCategory || 'General';
    this.minRate = typeof data.minRate === 'number' ? data.minRate : parseFloat(data.minRate) || 0;
    this.maxRate = typeof data.maxRate === 'number' ? data.maxRate : parseFloat(data.maxRate) || 0;
    this.currency = data.currency || 'USD';
    this.unit = data.unit || 'pcs';
    this.priority = typeof data.priority === 'number' ? data.priority : parseInt(data.priority, 10) || 1;
    this.isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = new Date().toISOString();
  }

  static validate(data) {
    const errors = [];
    if (!data.name || typeof data.name !== 'string' || !data.name.trim()) {
      errors.push('Rule name is required.');
    }
    if (!data.productCategory || typeof data.productCategory !== 'string') {
      errors.push('Product category is required.');
    }
    const min = parseFloat(data.minRate);
    const max = parseFloat(data.maxRate);
    if (isNaN(min) || min < 0) {
      errors.push('Minimum rate must be a non-negative number.');
    }
    if (isNaN(max) || max < 0) {
      errors.push('Maximum rate must be a non-negative number.');
    }
    if (!isNaN(min) && !isNaN(max) && min > max) {
      errors.push('Minimum rate cannot be greater than Maximum rate.');
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  isRateWithinBounds(rate) {
    const numericRate = parseFloat(rate);
    if (isNaN(numericRate)) return false;
    return numericRate >= this.minRate && numericRate <= this.maxRate;
  }
}

module.exports = RateRule;
