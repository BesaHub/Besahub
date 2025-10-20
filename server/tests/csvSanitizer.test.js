const { sanitizeCSVCell, sanitizeCSVRow } = require('../utils/csvSanitizer');

describe('CSV Formula Injection Protection', () => {
  describe('sanitizeCSVCell', () => {
    test('sanitizes formula injection with = prefix', () => {
      expect(sanitizeCSVCell('=SUM(A1:A10)')).toBe("'=SUM(A1:A10)");
      expect(sanitizeCSVCell('=1+1')).toBe("'=1+1");
      expect(sanitizeCSVCell('=cmd|"/c calc"!A1')).toBe("'=cmd|\"/c calc\"!A1");
    });

    test('sanitizes formula injection with + prefix', () => {
      expect(sanitizeCSVCell('+2+5')).toBe("'+2+5");
      expect(sanitizeCSVCell('+1-1')).toBe("'+1-1");
    });

    test('sanitizes formula injection with - prefix', () => {
      expect(sanitizeCSVCell('-2+5')).toBe("'-2+5");
      expect(sanitizeCSVCell('-1*2')).toBe("'-1*2");
    });

    test('sanitizes formula injection with @ prefix', () => {
      expect(sanitizeCSVCell('@SUM(A1)')).toBe("'@SUM(A1)");
      expect(sanitizeCSVCell('@SUM(1+1)')).toBe("'@SUM(1+1)");
    });

    test('sanitizes formula injection with | prefix', () => {
      expect(sanitizeCSVCell('|calc')).toBe("'|calc");
      expect(sanitizeCSVCell('|cmd')).toBe("'|cmd");
    });

    test('sanitizes formula injection with % prefix', () => {
      expect(sanitizeCSVCell('%calc')).toBe("'%calc");
      expect(sanitizeCSVCell('%cmd')).toBe("'%cmd");
    });

    test('preserves safe values', () => {
      expect(sanitizeCSVCell('Normal Text')).toBe('Normal Text');
      expect(sanitizeCSVCell('123')).toBe('123');
      expect(sanitizeCSVCell('address@example.com')).toBe('address@example.com');
      expect(sanitizeCSVCell('Multi-word description')).toBe('Multi-word description');
    });

    test('handles empty and null values', () => {
      expect(sanitizeCSVCell('')).toBe('');
      expect(sanitizeCSVCell(null)).toBe(null);
      expect(sanitizeCSVCell(undefined)).toBe(undefined);
    });

    test('handles values with leading whitespace', () => {
      expect(sanitizeCSVCell('  =SUM(A1)')).toBe("'  =SUM(A1)");
      expect(sanitizeCSVCell(' -1*2')).toBe("' -1*2");
    });

    test('does not modify safe values with special chars in middle', () => {
      expect(sanitizeCSVCell('Total = 100')).toBe('Total = 100');
      expect(sanitizeCSVCell('Income + Expenses')).toBe('Income + Expenses');
      expect(sanitizeCSVCell('Net - Tax')).toBe('Net - Tax');
    });

    test('handles numeric values', () => {
      expect(sanitizeCSVCell(123)).toBe(123);
      expect(sanitizeCSVCell(45.67)).toBe(45.67);
      expect(sanitizeCSVCell(0)).toBe(0);
    });

    test('prevents zero-width character bypass', () => {
      expect(sanitizeCSVCell('\u200B=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\uFEFF=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\u0000=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\u200C+cmd')).toBe("'+cmd");
      expect(sanitizeCSVCell('\u200D-formula')).toBe("'-formula");
    });

    test('prevents tab/newline prefix bypass', () => {
      expect(sanitizeCSVCell('\t=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\r=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\n=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\t+2+5')).toBe("'+2+5");
      expect(sanitizeCSVCell('\r\n@SUM(B1)')).toBe("'@SUM(B1)");
    });

    test('prevents multiple control characters bypass', () => {
      expect(sanitizeCSVCell('\u0000\u200B\uFEFF=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell('\t\r\n=HYPERLINK("http://evil.com")')).toBe("'=HYPERLINK(\"http://evil.com\")");
    });

    test('removes control characters but preserves safe content', () => {
      expect(sanitizeCSVCell('\u200BHello World')).toBe('Hello World');
      expect(sanitizeCSVCell('Test\u0000Value')).toBe('TestValue');
      expect(sanitizeCSVCell('\uFEFFNormal\u200BText')).toBe('NormalText');
    });

    test('preserves numeric zero', () => {
      expect(sanitizeCSVCell(0)).toBe(0);
      expect(sanitizeCSVCell('0')).toBe('0');
    });

    test('preserves boolean types', () => {
      expect(sanitizeCSVCell(true)).toBe(true);
      expect(sanitizeCSVCell(false)).toBe(false);
      expect(sanitizeCSVCell('true')).toBe('true');
      expect(sanitizeCSVCell('false')).toBe('false');
    });

    test('preserves numeric types', () => {
      expect(sanitizeCSVCell(123)).toBe(123);
      expect(sanitizeCSVCell(0)).toBe(0);
      expect(sanitizeCSVCell(45.67)).toBe(45.67);
      expect(sanitizeCSVCell(-10)).toBe(-10);
    });

    test('only sanitizes strings', () => {
      expect(sanitizeCSVCell('=SUM(A1)')).toBe("'=SUM(A1)");
      expect(sanitizeCSVCell(true)).toBe(true);
      expect(sanitizeCSVCell(false)).toBe(false);
      expect(sanitizeCSVCell(123)).toBe(123);
      expect(sanitizeCSVCell(0)).toBe(0);
    });

    test('converts null/undefined to empty string at call site', () => {
      // The sanitizer itself returns null/undefined unchanged
      // Callers use ?? '' to convert to empty string
      expect(sanitizeCSVCell(null)).toBe(null);
      expect(sanitizeCSVCell(undefined)).toBe(undefined);
    });

    test('preserves intentional leading whitespace', () => {
      expect(sanitizeCSVCell('  Suite 200')).toBe('  Suite 200');
      expect(sanitizeCSVCell('   Tab indented')).toBe('   Tab indented');
      expect(sanitizeCSVCell('    Four spaces')).toBe('    Four spaces');
    });

    test('preserves intentional trailing whitespace', () => {
      expect(sanitizeCSVCell('Code ABC  ')).toBe('Code ABC  ');
      expect(sanitizeCSVCell('End spaces   ')).toBe('End spaces   ');
    });

    test('preserves both leading and trailing whitespace', () => {
      expect(sanitizeCSVCell('  Centered text  ')).toBe('  Centered text  ');
      expect(sanitizeCSVCell('   Padded value   ')).toBe('   Padded value   ');
    });

    test('still detects formulas with leading spaces', () => {
      expect(sanitizeCSVCell('  =SUM(A1)')).toBe("'  =SUM(A1)");
      expect(sanitizeCSVCell('   =HYPERLINK("http://evil.com")')).toBe("'   =HYPERLINK(\"http://evil.com\")");
      expect(sanitizeCSVCell('  +2+5')).toBe("'  +2+5");
      expect(sanitizeCSVCell('   -formula')).toBe("'   -formula");
      expect(sanitizeCSVCell('    @SUM(B1)')).toBe("'    @SUM(B1)");
    });

    test('still detects formulas with trailing spaces', () => {
      expect(sanitizeCSVCell('=SUM(A1)  ')).toBe("'=SUM(A1)  ");
      expect(sanitizeCSVCell('+2+5   ')).toBe("'+2+5   ");
    });

    test('preserves whitespace in safe values', () => {
      expect(sanitizeCSVCell('  Normal text')).toBe('  Normal text');
      expect(sanitizeCSVCell('Normal text  ')).toBe('Normal text  ');
      expect(sanitizeCSVCell('  Normal text  ')).toBe('  Normal text  ');
    });

    test('sanitizes formulas with commas before CSV quoting', () => {
      const dangerous = '=HYPERLINK("http://evil.com", "Click me")';
      const sanitized = sanitizeCSVCell(dangerous);
      expect(sanitized).toBe("'=HYPERLINK(\"http://evil.com\", \"Click me\")");
      
      // Verify it starts with apostrophe (escaped)
      expect(sanitized.charAt(0)).toBe("'");
    });

    test('sanitizes complex formulas with multiple commas', () => {
      expect(sanitizeCSVCell('=SUM(A1,B2,C3)')).toBe("'=SUM(A1,B2,C3)");
      expect(sanitizeCSVCell('+AVERAGE(A1,B2)')).toBe("'+AVERAGE(A1,B2)");
      expect(sanitizeCSVCell('-MAX(A1,B2,C3,D4)')).toBe("'-MAX(A1,B2,C3,D4)");
      expect(sanitizeCSVCell('@IF(A1>0,B1,C1)')).toBe("'@IF(A1>0,B1,C1)");
    });

    test('sanitizes DDE and command injection with commas', () => {
      expect(sanitizeCSVCell('=cmd|"/c calc","safe"!A1')).toBe("'=cmd|\"/c calc\",\"safe\"!A1");
      expect(sanitizeCSVCell('+DDE("cmd","/c notepad","safe")')).toBe("'+DDE(\"cmd\",\"/c notepad\",\"safe\")");
    });

    test('sanitizes nested formulas with commas', () => {
      expect(sanitizeCSVCell('=IF(A1>0,SUM(B1,C1),MAX(D1,E1))')).toBe("'=IF(A1>0,SUM(B1,C1),MAX(D1,E1))");
      expect(sanitizeCSVCell('=HYPERLINK(CONCATENATE("http://",A1), "Click")')).toBe("'=HYPERLINK(CONCATENATE(\"http://\",A1), \"Click\")");
    });

    test('verifies sanitization happens before formatting', () => {
      // This test simulates the export flow:
      // 1. Sanitize first (adds apostrophe to dangerous values)
      // 2. Format after (adds quotes if needed)
      
      const dangerous = '=HYPERLINK("http://evil.com", "Click")';
      
      // Step 1: Sanitize FIRST
      const sanitized = sanitizeCSVCell(dangerous);
      expect(sanitized).toBe("'=HYPERLINK(\"http://evil.com\", \"Click\")");
      expect(sanitized.charAt(0)).toBe("'");
      
      // Step 2: Format AFTER (simulate CSV quoting)
      const formatted = sanitized.includes(',') ? `"${sanitized}"` : sanitized;
      expect(formatted).toBe("\"'=HYPERLINK(\"http://evil.com\", \"Click\")\"");
      
      // The apostrophe is preserved inside quotes, making it safe
      expect(formatted.includes("\"'=")).toBe(true);
    });
  });

  describe('sanitizeCSVRow', () => {
    test('sanitizes all fields in a row object', () => {
      const row = {
        name: '=SUM(A1:A10)',
        address: '123 Main St',
        price: '+1000',
        description: 'Normal description',
        formula: '@SUM(B1:B10)'
      };

      const sanitized = sanitizeCSVRow(row);

      expect(sanitized.name).toBe("'=SUM(A1:A10)");
      expect(sanitized.address).toBe('123 Main St');
      expect(sanitized.price).toBe("'+1000");
      expect(sanitized.description).toBe('Normal description');
      expect(sanitized.formula).toBe("'@SUM(B1:B10)");
    });

    test('handles empty row object', () => {
      const sanitized = sanitizeCSVRow({});
      expect(sanitized).toEqual({});
    });

    test('handles row with null and undefined values', () => {
      const row = {
        field1: null,
        field2: undefined,
        field3: '=SUM(A1)',
        field4: 'safe'
      };

      const sanitized = sanitizeCSVRow(row);

      expect(sanitized.field1).toBe(null);
      expect(sanitized.field2).toBe(undefined);
      expect(sanitized.field3).toBe("'=SUM(A1)");
      expect(sanitized.field4).toBe('safe');
    });

    test('sanitizes real-world contact import data', () => {
      const row = {
        firstName: 'John',
        lastName: '=HYPERLINK("http://evil.com","Click")',
        email: 'john@example.com',
        phone: '+1234567890',
        company: '-CompanyName'
      };

      const sanitized = sanitizeCSVRow(row);

      expect(sanitized.firstName).toBe('John');
      expect(sanitized.lastName).toBe("'=HYPERLINK(\"http://evil.com\",\"Click\")");
      expect(sanitized.email).toBe('john@example.com');
      expect(sanitized.phone).toBe("'+1234567890");
      expect(sanitized.company).toBe("'-CompanyName");
    });

    test('sanitizes real-world property import data', () => {
      const row = {
        name: 'Office Building',
        address: '=cmd|"/c calc"!A1',
        city: 'New York',
        price: '1000000',
        description: '@SUM(malicious)'
      };

      const sanitized = sanitizeCSVRow(row);

      expect(sanitized.name).toBe('Office Building');
      expect(sanitized.address).toBe("'=cmd|\"/c calc\"!A1");
      expect(sanitized.city).toBe('New York');
      expect(sanitized.price).toBe('1000000');
      expect(sanitized.description).toBe("'@SUM(malicious)");
    });
  });
});
