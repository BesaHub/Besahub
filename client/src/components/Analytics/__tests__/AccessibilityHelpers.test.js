import {
  getAriaLabel,
  getChartDescription,
  getScreenReaderText,
  validateChartData,
  validateKPIData
} from '../AccessibilityHelpers';

describe('AccessibilityHelpers', () => {
  describe('getAriaLabel', () => {
    it('returns correct aria label for revenue chart', () => {
      const label = getAriaLabel('revenue', 5);
      expect(label).toBe('Revenue chart showing 5 data points');
    });

    it('returns correct aria label for conversion chart', () => {
      const label = getAriaLabel('conversion', 3);
      expect(label).toBe('Lead conversion funnel with 3 stages');
    });

    it('returns default label for unknown chart type', () => {
      const label = getAriaLabel('unknown', 10);
      expect(label).toBe('Chart with 10 data points');
    });
  });

  describe('getChartDescription', () => {
    it('returns correct description for revenue chart', () => {
      const data = [{ revenue: 1000 }, { revenue: 2000 }];
      const description = getChartDescription('revenue', data);
      expect(description).toContain('revenue trends');
      expect(description).toContain('$3,000');
    });

    it('returns correct description for conversion chart', () => {
      const description = getChartDescription('conversion', []);
      expect(description).toContain('funnel chart');
      expect(description).toContain('conversion rates');
    });

    it('returns default description for unknown chart type', () => {
      const description = getChartDescription('unknown', []);
      expect(description).toContain('data visualization');
    });
  });

  describe('getScreenReaderText', () => {
    it('formats currency correctly', () => {
      const text = getScreenReaderText(1234567, 'currency');
      expect(text).toBe('$1,234,567');
    });

    it('formats percentage correctly', () => {
      const text = getScreenReaderText(85.5, 'percentage');
      expect(text).toBe('85.5%');
    });

    it('formats number correctly', () => {
      const text = getScreenReaderText(1234567, 'number');
      expect(text).toBe('1,234,567');
    });

    it('formats date correctly', () => {
      const text = getScreenReaderText('2023-12-25', 'date');
      expect(text).toBe('12/25/2023');
    });

    it('returns string for unknown format', () => {
      const text = getScreenReaderText('test', 'unknown');
      expect(text).toBe('test');
    });
  });
});
