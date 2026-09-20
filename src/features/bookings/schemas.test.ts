import { flightSchema, hotelSchema } from './schemas';

const flight = {
  airline: '',
  flightNumber: 'LA8084',
  from: 'GRU',
  to: 'NRT',
  depDate: '2027-04-01',
  depTime: '22:10',
  depTimezone: 'America/Sao_Paulo',
  arrDate: '2027-04-03',
  arrTime: '06:30',
  arrTimezone: 'Asia/Tokyo',
  terminal: '',
  gate: '',
  seat: '',
  baggage: '',
  bookingCode: '',
  notes: '',
};

const messages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
  result.error?.issues.map((issue) => issue.message) ?? [];

describe('flightSchema', () => {
  it('accepts a real overnight flight across zones', () => {
    expect(flightSchema.safeParse(flight).success).toBe(true);
  });

  it('compares instants, not wall clocks: landing at an earlier clock time can still be valid', () => {
    // Tokyo 18:00 to Los Angeles 11:00 on the same calendar day is a 9 h flight across the date line.
    const westbound = {
      ...flight,
      depDate: '2027-04-01',
      depTime: '18:00',
      depTimezone: 'Asia/Tokyo',
      arrDate: '2027-04-01',
      arrTime: '11:00',
      arrTimezone: 'America/Los_Angeles',
    };
    expect(flightSchema.safeParse(westbound).success).toBe(true);
  });

  it('refuses a landing before the takeoff', () => {
    const result = flightSchema.safeParse({ ...flight, arrDate: '2027-04-01' });
    expect(result.success).toBe(false);
    expect(messages(result)).toContain('validation.arrivalBeforeDeparture');
  });

  it('requires three-letter airport codes and real times', () => {
    const result = flightSchema.safeParse({ ...flight, from: 'GRUU', depTime: '25:00' });
    expect(messages(result)).toEqual(
      expect.arrayContaining(['validation.airportCode', 'validation.timeInvalid']),
    );
  });
});

describe('hotelSchema', () => {
  const hotel = {
    name: 'Hotel Sakura',
    address: '',
    checkInDate: '2027-04-03',
    checkInTime: '15:00',
    checkOutDate: '2027-04-07',
    checkOutTime: '11:00',
    confirmationCode: '',
    contactPhone: '',
    bookingUrl: '',
    notes: '',
  };

  it('accepts a stay and refuses a checkout before the check-in', () => {
    expect(hotelSchema.safeParse(hotel).success).toBe(true);
    const result = hotelSchema.safeParse({
      ...hotel,
      checkOutDate: '2027-04-03',
      checkOutTime: '10:00',
    });
    expect(messages(result)).toContain('validation.checkoutBeforeCheckin');
  });

  it('only accepts http(s) booking links', () => {
    expect(
      hotelSchema.safeParse({ ...hotel, bookingUrl: 'https://booking.example/x' }).success,
    ).toBe(true);
    expect(hotelSchema.safeParse({ ...hotel, bookingUrl: 'javascript:alert(1)' }).success).toBe(
      false,
    );
  });
});
