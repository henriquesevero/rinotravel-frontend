import {
  addDays,
  daysBetween,
  eachDay,
  formatDuration,
  isTime,
  joinOptionalZoned,
  joinZoned,
  minutesBetween,
  splitZoned,
  zonedInstant,
} from './zoned';

describe('zoned time', () => {
  it('splits and joins without changing the wall clock', () => {
    const zoned = joinZoned('2027-04-10', '09:30', 'Asia/Tokyo');
    expect(zoned).toEqual({ dateTime: '2027-04-10T09:30:00', timezone: 'Asia/Tokyo' });
    expect(splitZoned(zoned)).toEqual({ date: '2027-04-10', time: '09:30' });
    expect(splitZoned(undefined)).toEqual({ date: '', time: '' });
  });

  it('turns an incomplete optional time into null so it can be cleared', () => {
    expect(joinOptionalZoned('2027-04-10', '', 'UTC')).toBeNull();
    expect(joinOptionalZoned('', '09:30', 'UTC')).toBeNull();
  });

  it.each([
    ['00:00', true],
    ['23:59', true],
    ['24:00', false],
    ['9:30', false],
    ['09:60', false],
    ['', false],
  ])('isTime(%p) is %p', (value, expected) => {
    expect(isTime(value)).toBe(expected);
  });

  it('computes the absolute moment from the zone, not the device', () => {
    // Tokyo is UTC+9 all year; São Paulo is UTC-3 (no daylight saving since 2019).
    expect(zonedInstant({ dateTime: '2027-04-10T09:00:00', timezone: 'Asia/Tokyo' })).toBe(
      Date.UTC(2027, 3, 10, 0, 0),
    );
    expect(zonedInstant({ dateTime: '2027-04-10T09:00:00', timezone: 'America/Sao_Paulo' })).toBe(
      Date.UTC(2027, 3, 10, 12, 0),
    );
  });

  it('measures a flight across zones (São Paulo 22:10 to Tokyo 06:30, two days later)', () => {
    const departure = joinZoned('2027-04-01', '22:10', 'America/Sao_Paulo');
    const arrival = joinZoned('2027-04-03', '06:30', 'Asia/Tokyo');
    expect(minutesBetween(departure, arrival)).toBe(20 * 60 + 20);
  });

  it('is negative when the landing precedes the takeoff', () => {
    const departure = joinZoned('2027-04-01', '22:10', 'America/Sao_Paulo');
    const arrival = joinZoned('2027-04-01', '06:30', 'Asia/Tokyo');
    expect(minutesBetween(departure, arrival)).toBeLessThan(0);
  });

  it('handles a daylight-saving change (New York springs forward on 2027-03-14)', () => {
    const before = joinZoned('2027-03-14', '01:00', 'America/New_York');
    const after = joinZoned('2027-03-14', '04:00', 'America/New_York');
    // 02:00 does not exist that night, so 01:00 to 04:00 on the wall clock is two real hours.
    expect(minutesBetween(before, after)).toBe(120);
  });

  it('returns NaN for garbage instead of throwing', () => {
    expect(zonedInstant({ dateTime: 'nope', timezone: 'UTC' })).toBeNaN();
    expect(zonedInstant({ dateTime: '2027-04-10T09:00:00', timezone: 'Not/AZone' })).toBeNaN();
  });
});

describe('civil day arithmetic', () => {
  it('adds days across month and year boundaries', () => {
    expect(addDays('2027-01-31', 1)).toBe('2027-02-01');
    expect(addDays('2027-12-31', 1)).toBe('2028-01-01');
    expect(addDays('2028-03-01', -1)).toBe('2028-02-29');
  });

  it('counts days between dates', () => {
    expect(daysBetween('2027-04-01', '2027-04-15')).toBe(14);
    expect(daysBetween('2027-04-15', '2027-04-01')).toBe(-14);
  });

  it('lists every day of a range inclusive, and nothing for a reversed range', () => {
    expect(eachDay('2027-04-01', '2027-04-03')).toEqual(['2027-04-01', '2027-04-02', '2027-04-03']);
    expect(eachDay('2027-04-03', '2027-04-01')).toEqual([]);
  });
});

describe('formatDuration', () => {
  it.each([
    [45, '45 min'],
    [60, '1 h'],
    [80, '1 h 20'],
    [1220, '20 h 20'],
  ])('%i minutes is %p', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});
