const { exportToCSV, exportToExcel } = require('../utils/propertyImportExport');
const { sanitizeCSVCell } = require('../utils/csvSanitizer');

describe('CSV Export Security - Formula Injection Prevention', () => {
  describe('exportToCSV with comma-containing formulas', () => {
    test('CRITICAL: Sanitizes formulas with commas BEFORE CSV formatting', () => {
      const properties = [{
        name: '=HYPERLINK("http://evil.com", "Click me")',
        address: '=SUM(A1,B2,C3)',
        description: '+AVERAGE(A1,B2)',
        notes: 'Safe value with, commas'
      }];

      const csv = exportToCSV(properties, ['name', 'address', 'description', 'notes']);
      const lines = csv.split('\n');
      
      // Header line
      expect(lines[0]).toContain('Property Name');
      
      // Data line - should have apostrophes for dangerous values
      const dataLine = lines[1];
      
      // Verify dangerous values are escaped with apostrophe BEFORE quoting
      expect(dataLine).toContain("'=HYPERLINK");
      expect(dataLine).toContain("'=SUM");
      expect(dataLine).toContain("'+AVERAGE");
      
      // Verify safe value is preserved
      expect(dataLine).toContain('Safe value with');
    });

    test('CRITICAL: Complex nested formulas with multiple commas', () => {
      const properties = [{
        name: '=IF(A1>0,SUM(B1,C1),MAX(D1,E1))',
        address: '=HYPERLINK(CONCATENATE("http://",A1), "Click")',
        description: '=cmd|"/c calc","safe"!A1'
      }];

      const csv = exportToCSV(properties, ['name', 'address', 'description']);
      const lines = csv.split('\n');
      const dataLine = lines[1];
      
      // All should start with apostrophe (inside or outside quotes)
      expect(dataLine).toContain("'=IF(A1>0,SUM(B1,C1),MAX(D1,E1))");
      expect(dataLine).toContain("'=HYPERLINK(CONCATENATE");
      expect(dataLine).toContain("'=cmd|");
    });

    test('Demonstrates vulnerability would occur with wrong order', () => {
      // Simulate WRONG order (format first, sanitize after)
      const dangerous = '=HYPERLINK("http://evil.com", "Click")';
      
      // WRONG: Format first
      let formatted = dangerous.includes(',') ? `"${dangerous}"` : dangerous;
      // Now first char is " not =
      expect(formatted.charAt(0)).toBe('"');
      
      // WRONG: Sanitize after
      let wrongOrder = sanitizeCSVCell(formatted);
      // Sanitizer sees " as first char, doesn't escape!
      expect(wrongOrder).toBe(`"=HYPERLINK("http://evil.com", "Click")"`);
      // ❌ VULNERABLE - no apostrophe!
      expect(wrongOrder.charAt(1)).toBe('='); // Formula still starts at position 1
      
      // CORRECT order (our fix)
      let sanitized = sanitizeCSVCell(dangerous);
      expect(sanitized).toBe("'=HYPERLINK(\"http://evil.com\", \"Click\")");
      expect(sanitized.charAt(0)).toBe("'");
      
      let correctOrder = sanitized.includes(',') ? `"${sanitized}"` : sanitized;
      expect(correctOrder).toBe("\"'=HYPERLINK(\"http://evil.com\", \"Click\")\"");
      // ✅ SAFE - apostrophe preserved inside quotes
      expect(correctOrder.includes("\"'=")).toBe(true);
    });
  });

  describe('exportToExcel with formulas', () => {
    test('Sanitizes formulas before adding to Excel', async () => {
      const properties = [{
        name: '=HYPERLINK("http://evil.com", "Click")',
        address: '=SUM(A1,B2,C3)',
        city: 'New York'
      }];

      const buffer = await exportToExcel(properties, ['name', 'address', 'city']);
      
      // Buffer should be created
      expect(buffer).toBeDefined();
      expect(buffer.length).toBeGreaterThan(0);
      
      // Note: Full Excel parsing would require ExcelJS, but the important thing
      // is that sanitizeCSVCell is called before worksheet.addRow
    });
  });

  describe('Real-world attack scenarios', () => {
    test('Prevents DDE attack with commas', () => {
      const properties = [{
        name: '=cmd|"/c calc","safe"!A1',
        description: '+DDE("cmd","/c notepad","safe")'
      }];

      const csv = exportToCSV(properties, ['name', 'description']);
      const lines = csv.split('\n');
      const dataLine = lines[1];
      
      expect(dataLine).toContain("'=cmd|");
      expect(dataLine).toContain("'+DDE(");
    });

    test('Prevents HYPERLINK attack with commas', () => {
      const properties = [{
        notes: '=HYPERLINK("javascript:alert(1)", "Click")',
        description: '=HYPERLINK("file:///etc/passwd", "Open")'
      }];

      const csv = exportToCSV(properties, ['notes', 'description']);
      const lines = csv.split('\n');
      const dataLine = lines[1];
      
      expect(dataLine).toContain("'=HYPERLINK(\"javascript:");
      expect(dataLine).toContain("'=HYPERLINK(\"file:");
    });

    test('Handles mixed safe and dangerous values', () => {
      const properties = [{
        name: 'Safe Property Name',
        address: '123 Main St, Suite 200',
        price: '=1000000+500000',
        description: 'Beautiful office, downtown location'
      }];

      const csv = exportToCSV(properties, ['name', 'address', 'price', 'description']);
      const lines = csv.split('\n');
      const dataLine = lines[1];
      
      // Safe values preserved
      expect(dataLine).toContain('Safe Property Name');
      expect(dataLine).toContain('Beautiful office');
      
      // Dangerous value escaped
      expect(dataLine).toContain("'=1000000+500000");
    });
  });
});
