import { describe, it, expect } from 'vitest';

// Import the functions we want to test
// Note: In a real Next.js app, you'd need to extract these to a separate utility file
// For now, we'll test the logic inline

describe('Booking Time Validation', () => {
  const isWithinOperatingHours = (startTime: string, duration: number): boolean => {
    const [hour, minute] = startTime.split(':').map(Number);
    const startMinutes = hour * 60 + minute;
    const endMinutes = startMinutes + duration;
    
    // Operating hours: 10:00 (600 minutes) to 02:00 next day (120 minutes)
    const operatingStart = 10 * 60; // 10:00
    const operatingEnd = 2 * 60; // 02:00 next day
    
    // Handle midnight crossing
    if (startMinutes >= operatingStart) {
      // Same day booking (10:00 - 23:59)
      return endMinutes <= (24 * 60 + operatingEnd); // Can end up to 02:00 next day
    } else {
      // Early morning booking (00:00 - 02:00)
      return startMinutes >= 0 && endMinutes <= operatingEnd;
    }
  };

  describe('Operating Hours Validation', () => {
    it('should allow 10:00 start with 60min duration', () => {
      expect(isWithinOperatingHours('10:00', 60)).toBe(true);
    });

    it('should allow 10:00 start with 120min duration', () => {
      expect(isWithinOperatingHours('10:00', 120)).toBe(true);
    });

    it('should allow 23:30 start with 60min duration', () => {
      expect(isWithinOperatingHours('23:30', 60)).toBe(true);
    });

    it('should allow 01:30 start with 120min duration (ends 03:30)', () => {
      expect(isWithinOperatingHours('01:30', 120)).toBe(true);
    });

    it('should allow 02:00 start with 120min duration (ends 04:00)', () => {
      expect(isWithinOperatingHours('02:00', 120)).toBe(true);
    });

    it('should reject 02:00 start with 150min duration (ends 04:30)', () => {
      expect(isWithinOperatingHours('02:00', 150)).toBe(false);
    });

    it('should reject 09:00 start with 60min duration', () => {
      expect(isWithinOperatingHours('09:00', 60)).toBe(false);
    });

    it('should reject 03:00 start with 60min duration', () => {
      expect(isWithinOperatingHours('03:00', 60)).toBe(false);
    });
  });

  describe('Edge Cases', () => {
    it('should handle midnight crossing correctly', () => {
      expect(isWithinOperatingHours('23:30', 90)).toBe(true); // 23:30 - 01:00
    });

    it('should handle early morning bookings', () => {
      expect(isWithinOperatingHours('00:00', 120)).toBe(true); // 00:00 - 02:00
      expect(isWithinOperatingHours('01:00', 60)).toBe(true);  // 01:00 - 02:00
    });

    it('should reject bookings that extend past 04:00', () => {
      expect(isWithinOperatingHours('02:30', 120)).toBe(false); // 02:30 - 04:30
      expect(isWithinOperatingHours('03:00', 60)).toBe(false);  // 03:00 - 04:00
    });
  });
});
