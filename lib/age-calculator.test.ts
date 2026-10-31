import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateAgeFallback,
  compareDatesFallback,
  isLeapYear,
  getWesternZodiac,
  getGeneration,
} from './age-calculator';

test('chronological age calculates exact years, months, and days', () => {
  const result = calculateAgeFallback('1996-05-14', '2026-10-31', '08:30');
  assert.equal(result.chronological.years, 30);
  assert.equal(result.chronological.months, 5);
  assert.equal(result.chronological.days, 17);
  assert.equal(result.chronological.is_birthday_today, false);
  assert.equal(result.totals.total_months, 365);
  assert.equal(result.totals.total_days, 11127);
  assert.equal(result.birth_facts.western_zodiac, 'Taurus');
  assert.equal(result.birth_facts.chinese_zodiac, 'Rat');
  assert.equal(result.birth_facts.generation, 'Millennial (Gen Y)');
});

test('handles month borrow when target day is earlier than birth day', () => {
  const result = calculateAgeFallback('2000-08-25', '2026-10-10');
  assert.equal(result.chronological.years, 26);
  assert.equal(result.chronological.months, 1);
  // September has 30 days: Aug 25 -> Sep 25 is 1 month, Sep 25 -> Oct 10 is 15 days
  assert.equal(result.chronological.days, 15);
});

test('handles leap-year birthday (Feb 29) on non-leap target year', () => {
  const result = calculateAgeFallback('2004-02-29', '2026-03-01');
  assert.equal(result.chronological.years, 22);
  assert.equal(result.chronological.months, 0);
  assert.equal(result.chronological.days, 1);
  assert.equal(result.birth_facts.is_leap_year, true);
  assert.equal(result.totals.leap_days_experienced, 6); // 2004, 2008, 2012, 2016, 2020, 2024
});

test('detects exact birthday today with 0 days remaining', () => {
  const result = calculateAgeFallback('1995-10-31', '2026-10-31');
  assert.equal(result.chronological.years, 31);
  assert.equal(result.chronological.months, 0);
  assert.equal(result.chronological.days, 0);
  assert.equal(result.chronological.is_birthday_today, true);
  assert.equal(result.next_birthday.days_remaining, 0);
});

test('throws validation error when birth date is after target date', () => {
  assert.throws(
    () => calculateAgeFallback('2028-01-01', '2026-10-31'),
    /Date of birth cannot be after the target calculation date/
  );
});

test('compares two birth dates accurately', () => {
  const comp = compareDatesFallback('1992-03-10', '1996-05-14', 'Elena', 'Marcus');
  assert.equal(comp.older_person, 'Elena');
  assert.equal(comp.younger_person, 'Marcus');
  assert.equal(comp.is_same_date, false);
  assert.equal(comp.difference.years, 4);
  assert.equal(comp.difference.months, 2);
  assert.equal(comp.difference.days, 4);
  assert.equal(comp.total_days_apart, 1526);
});

test('zodiac and generation helper edge cases', () => {
  assert.equal(isLeapYear(2000), true);
  assert.equal(isLeapYear(1900), false);
  assert.equal(getWesternZodiac(12, 25).sign, 'Capricorn');
  assert.equal(getGeneration(2002), 'Generation Z');
});
