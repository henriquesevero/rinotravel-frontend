import { flightSchema, hotelSchema, ticketSchema } from './schemas';

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

describe('the price of a flight or a stay', () => {
  it('is optional, and a number in the currency chosen beside it', () => {
    expect(flightSchema.safeParse(flight).success).toBe(true);
    expect(
      flightSchema.safeParse({ ...flight, cost: '4200,50', costCurrency: 'BRL' }).success,
    ).toBe(true);
    const result = flightSchema.safeParse({ ...flight, cost: 'caro', costCurrency: 'BRL' });
    expect(messages(result)).toContain('validation.moneyInvalid');
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

describe('ticketSchema', () => {
  const schema = ticketSchema('USD');
  const ticket = {
    name: 'Hamilton',
    kind: 'SHOW',
    quantity: '2',
    venue: 'Richard Rodgers Theatre',
    address: '',
    date: '2027-04-03',
    startTime: '19:00',
    endTime: '21:45',
    confirmationCode: '',
    seat: '',
    cost: '',
    status: 'PLANNED',
    notes: '',
  };

  it('accepts a ticket with where and when, or with neither', () => {
    expect(schema.safeParse(ticket).success).toBe(true);
    expect(
      schema.safeParse({ ...ticket, venue: '', date: '', startTime: '', endTime: '' }).success,
    ).toBe(true);
  });

  it('needs a quantity of at least one', () => {
    expect(messages(schema.safeParse({ ...ticket, quantity: '0' }))).toContain(
      'validation.quantityInvalid',
    );
    expect(schema.safeParse({ ...ticket, quantity: 'two' }).success).toBe(false);
    expect(schema.safeParse({ ...ticket, quantity: '1000' }).success).toBe(false);
  });

  it('keeps a time and its day together, and an end after its start', () => {
    expect(schema.safeParse({ ...ticket, date: '' }).success).toBe(false);
    expect(schema.safeParse({ ...ticket, startTime: '', endTime: '' }).success).toBe(false);
    expect(schema.safeParse({ ...ticket, endTime: '18:00' }).success).toBe(false);
    expect(messages(schema.safeParse({ ...ticket, endTime: '18:00' }))).toContain(
      'validation.ticketEndBeforeStart',
    );
    expect(schema.safeParse({ ...ticket, endTime: '' }).success).toBe(true);
  });
});
