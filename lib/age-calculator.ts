export interface ChronologicalAge {
  years: number;
  months: number;
  days: number;
  is_birthday_today: boolean;
}

export interface AgeTotals {
  total_months: number;
  total_weeks: number;
  remaining_days_after_weeks: number;
  total_days: number;
  total_hours: number;
  total_minutes: number;
  total_seconds: number;
  leap_days_experienced: number;
}

export interface NextBirthdayInfo {
  date: string;
  formatted_date: string;
  weekday: string;
  days_remaining: number;
  months_remaining: number;
  extra_days_remaining: number;
  turning_age: number;
}

export interface BirthFacts {
  born_weekday: string;
  formatted_birth_date: string;
  day_of_year: number;
  is_leap_year: boolean;
  western_zodiac: string;
  zodiac_element: string;
  ruling_planet: string;
  chinese_zodiac: string;
  generation: string;
}

export interface AgeMilestone {
  title: string;
  category: 'Days' | 'Seconds';
  date: string;
  formatted_date: string;
  achieved: boolean;
  days_delta: number;
}

export interface PlanetaryAge {
  planet: string;
  age: number;
  period_label: string;
  next_birthday_in_days: number;
}

export interface AgeCalculationResult {
  engine: string;
  input: {
    birth_date: string;
    target_date: string;
    birth_time: string;
  };
  chronological: ChronologicalAge;
  totals: AgeTotals;
  next_birthday: NextBirthdayInfo;
  birth_facts: BirthFacts;
  milestones: AgeMilestone[];
  planetary_ages: PlanetaryAge[];
}

export interface AgeComparisonResult {
  engine: string;
  older_person: string;
  younger_person: string;
  is_same_date: boolean;
  difference: ChronologicalAge;
  total_days_apart: number;
  total_weeks_apart: number;
  total_hours_apart: number;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const WESTERN_ZODIAC_TABLE: Array<{
  sign: string;
  endMonth: number;
  endDay: number;
  element: string;
  ruler: string;
}> = [
  {sign: 'Capricorn', endMonth: 1, endDay: 19, element: 'Earth', ruler: 'Saturn'},
  {sign: 'Aquarius', endMonth: 2, endDay: 18, element: 'Air', ruler: 'Uranus'},
  {sign: 'Pisces', endMonth: 3, endDay: 20, element: 'Water', ruler: 'Neptune'},
  {sign: 'Aries', endMonth: 4, endDay: 19, element: 'Fire', ruler: 'Mars'},
  {sign: 'Taurus', endMonth: 5, endDay: 20, element: 'Earth', ruler: 'Venus'},
  {sign: 'Gemini', endMonth: 6, endDay: 20, element: 'Air', ruler: 'Mercury'},
  {sign: 'Cancer', endMonth: 7, endDay: 22, element: 'Water', ruler: 'Moon'},
  {sign: 'Leo', endMonth: 8, endDay: 22, element: 'Fire', ruler: 'Sun'},
  {sign: 'Virgo', endMonth: 9, endDay: 22, element: 'Earth', ruler: 'Mercury'},
  {sign: 'Libra', endMonth: 10, endDay: 22, element: 'Air', ruler: 'Venus'},
  {sign: 'Scorpio', endMonth: 11, endDay: 21, element: 'Water', ruler: 'Pluto'},
  {sign: 'Sagittarius', endMonth: 12, endDay: 21, element: 'Fire', ruler: 'Jupiter'},
  {sign: 'Capricorn', endMonth: 12, endDay: 31, element: 'Earth', ruler: 'Saturn'},
];

const CHINESE_ZODIAC = [
  'Monkey',
  'Rooster',
  'Dog',
  'Pig',
  'Rat',
  'Ox',
  'Tiger',
  'Rabbit',
  'Dragon',
  'Snake',
  'Horse',
  'Goat',
];

const PLANET_ORBITAL_RATIOS = [
  {planet: 'Mercury', orbital_days: 87.97, period_label: '88 Earth days'},
  {planet: 'Venus', orbital_days: 224.7, period_label: '225 Earth days'},
  {planet: 'Earth', orbital_days: 365.256, period_label: '365.25 Earth days'},
  {planet: 'Mars', orbital_days: 686.98, period_label: '687 Earth days'},
  {planet: 'Jupiter', orbital_days: 4332.59, period_label: '11.86 Earth years'},
  {planet: 'Saturn', orbital_days: 10759.22, period_label: '29.45 Earth years'},
];

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

export function daysInMonth(year: number, month1Indexed: number): number {
  return new Date(Date.UTC(year, month1Indexed, 0)).getUTCDate();
}

export interface ParsedDate {
  year: number;
  month: number;
  day: number;
  utcMs: number;
}

export function parseIsoDate(dateStr: string, fieldName = 'date'): ParsedDate {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
    throw new Error(`Invalid ${fieldName} format '${dateStr}'. Expected YYYY-MM-DD.`);
  }
  const [yStr, mStr, dStr] = dateStr.trim().split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month in ${fieldName} '${dateStr}'.`);
  }
  const maxDay = daysInMonth(year, month);
  if (day < 1 || day > maxDay) {
    throw new Error(`Invalid calendar day in ${fieldName} '${dateStr}'.`);
  }
  const utcMs = Date.UTC(year, month - 1, day);
  return {year, month, day, utcMs};
}

export function toIsoString(d: ParsedDate): string {
  return `${String(d.year).padStart(4, '0')}-${String(d.month).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;
}

export function formatLongDate(d: ParsedDate): string {
  return `${MONTHS_LONG[d.month - 1]} ${String(d.day).padStart(2, '0')}, ${d.year}`;
}

export function formatShortDate(d: ParsedDate): string {
  return `${MONTHS_SHORT[d.month - 1]} ${String(d.day).padStart(2, '0')}, ${d.year}`;
}

export function getWeekdayName(d: ParsedDate): string {
  const dt = new Date(d.utcMs);
  return WEEKDAYS[dt.getUTCDay()];
}

export function addDays(d: ParsedDate, offsetDays: number): ParsedDate {
  const targetMs = d.utcMs + offsetDays * 86_400_000;
  const dt = new Date(targetMs);
  return {
    year: dt.getUTCFullYear(),
    month: dt.getUTCMonth() + 1,
    day: dt.getUTCDate(),
    utcMs: targetMs,
  };
}

export function getWesternZodiac(month: number, day: number) {
  for (const item of WESTERN_ZODIAC_TABLE) {
    if ((month === item.endMonth && day <= item.endDay) || month < item.endMonth) {
      return {
        sign: item.sign,
        element: item.element,
        ruling_planet: item.ruler,
      };
    }
  }
  return {sign: 'Capricorn', element: 'Earth', ruling_planet: 'Saturn'};
}

export function getChineseZodiac(year: number): string {
  return CHINESE_ZODIAC[year % 12];
}

export function getGeneration(year: number): string {
  if (year >= 2025) return 'Generation Beta';
  if (year >= 2013) return 'Generation Alpha';
  if (year >= 1997) return 'Generation Z';
  if (year >= 1981) return 'Millennial (Gen Y)';
  if (year >= 1965) return 'Generation X';
  if (year >= 1946) return 'Baby Boomer';
  return 'Silent / Traditionalist';
}

function safeBirthdayInYear(birth: ParsedDate, targetYear: number): ParsedDate {
  if (birth.month === 2 && birth.day === 29 && !isLeapYear(targetYear)) {
    return {
      year: targetYear,
      month: 2,
      day: 28,
      utcMs: Date.UTC(targetYear, 1, 28),
    };
  }
  return {
    year: targetYear,
    month: birth.month,
    day: birth.day,
    utcMs: Date.UTC(targetYear, birth.month - 1, birth.day),
  };
}

export function calculateAgeFallback(
  birthDateStr: string,
  targetDateStr?: string,
  birthTimeStr = '00:00'
): AgeCalculationResult {
  const birth = parseIsoDate(birthDateStr, 'birth_date');
  const target = targetDateStr
    ? parseIsoDate(targetDateStr, 'target_date')
    : parseIsoDate(new Date().toISOString().slice(0, 10), 'target_date');

  if (birth.utcMs > target.utcMs) {
    throw new Error('Date of birth cannot be after the target calculation date.');
  }
  if (birth.year < 1850) {
    throw new Error('Date of birth must be in or after the year 1850.');
  }

  let hour = 0;
  let minute = 0;
  if (birthTimeStr && birthTimeStr.includes(':')) {
    const [h, m] = birthTimeStr.trim().split(':');
    const parsedH = Number(h);
    const parsedM = Number(m);
    if (!Number.isNaN(parsedH)) hour = Math.max(0, Math.min(23, parsedH));
    if (!Number.isNaN(parsedM)) minute = Math.max(0, Math.min(59, parsedM));
  }

  let years = target.year - birth.year;
  let months = target.month - birth.month;
  let days = target.day - birth.day;

  if (days < 0) {
    months -= 1;
    const prevMonth = target.month > 1 ? target.month - 1 : 12;
    const prevYear = target.month > 1 ? target.year : target.year - 1;
    const daysInPrevMonth = daysInMonth(prevYear, prevMonth);
    days = daysInPrevMonth - Math.min(birth.day, daysInPrevMonth) + target.day;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const deltaDays = Math.round((target.utcMs - birth.utcMs) / 86_400_000);
  const totalWeeks = Math.floor(deltaDays / 7);
  const remainingDaysAfterWeeks = deltaDays % 7;
  const totalMonths = years * 12 + months;
  const totalHours = deltaDays * 24;
  const totalMinutes = totalHours * 60;
  const totalSeconds = totalMinutes * 60;

  const thisYearBday = safeBirthdayInYear(birth, target.year);
  let nextBday: ParsedDate;
  let turningAge: number;
  if (thisYearBday.utcMs >= target.utcMs) {
    nextBday = thisYearBday;
    turningAge = target.year - birth.year;
  } else {
    nextBday = safeBirthdayInYear(birth, target.year + 1);
    turningAge = target.year + 1 - birth.year;
  }

  const daysUntilNextBirthday = Math.round((nextBday.utcMs - target.utcMs) / 86_400_000);
  let nextBdayMonths = (nextBday.year - target.year) * 12 + (nextBday.month - target.month);
  let nextBdayRemDays = nextBday.day - target.day;
  if (nextBdayRemDays < 0) {
    nextBdayMonths -= 1;
    const prevM = nextBday.month > 1 ? nextBday.month - 1 : 12;
    const prevY = nextBday.month > 1 ? nextBday.year : nextBday.year - 1;
    nextBdayRemDays += daysInMonth(prevY, prevM);
  }

  const milestoneDefs: Array<{
    title: string;
    category: 'Days' | 'Seconds';
    days_offset: number;
  }> = [
    {title: '1,000 Days Old', category: 'Days', days_offset: 1000},
    {title: '5,000 Days Old', category: 'Days', days_offset: 5000},
    {title: '10,000 Days Old', category: 'Days', days_offset: 10000},
    {title: '15,000 Days Old', category: 'Days', days_offset: 15000},
    {title: '20,000 Days Old', category: 'Days', days_offset: 20000},
    {
      title: '500 Million Seconds',
      category: 'Seconds',
      days_offset: Math.round(500_000_000 / 86400),
    },
    {
      title: '1 Billion Seconds',
      category: 'Seconds',
      days_offset: Math.round(1_000_000_000 / 86400),
    },
    {
      title: '2 Billion Seconds',
      category: 'Seconds',
      days_offset: Math.round(2_000_000_000 / 86400),
    },
  ];

  const milestones: AgeMilestone[] = milestoneDefs.map((m) => {
    const mDate = addDays(birth, m.days_offset);
    const diffFromTarget = Math.round((mDate.utcMs - target.utcMs) / 86_400_000);
    return {
      title: m.title,
      category: m.category,
      date: toIsoString(mDate),
      formatted_date: formatShortDate(mDate),
      achieved: diffFromTarget <= 0,
      days_delta: diffFromTarget,
    };
  });

  const planetaryAges: PlanetaryAge[] = PLANET_ORBITAL_RATIOS.map((p) => {
    const pAge = Number((deltaDays / p.orbital_days).toFixed(2));
    const nextWhole = Math.floor(deltaDays / p.orbital_days) + 1;
    const daysToNext = Math.max(1, Math.round(nextWhole * p.orbital_days - deltaDays));
    return {
      planet: p.planet,
      age: pAge,
      period_label: p.period_label,
      next_birthday_in_days: daysToNext,
    };
  });

  const zodiac = getWesternZodiac(birth.month, birth.day);
  let leapYearsLived = 0;
  for (let y = birth.year; y <= target.year; y++) {
    if (isLeapYear(y)) {
      const feb29Ms = Date.UTC(y, 1, 29);
      if (feb29Ms >= birth.utcMs && feb29Ms <= target.utcMs) {
        leapYearsLived += 1;
      }
    }
  }

  const startOfYearMs = Date.UTC(birth.year, 0, 1);
  const dayOfYear = Math.round((birth.utcMs - startOfYearMs) / 86_400_000) + 1;

  return {
    engine: 'FastAPI Python 3.10 Chronos Engine',
    input: {
      birth_date: toIsoString(birth),
      target_date: toIsoString(target),
      birth_time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
    },
    chronological: {
      years,
      months,
      days,
      is_birthday_today: daysUntilNextBirthday === 0,
    },
    totals: {
      total_months: totalMonths,
      total_weeks: totalWeeks,
      remaining_days_after_weeks: remainingDaysAfterWeeks,
      total_days: deltaDays,
      total_hours: totalHours,
      total_minutes: totalMinutes,
      total_seconds: totalSeconds,
      leap_days_experienced: leapYearsLived,
    },
    next_birthday: {
      date: toIsoString(nextBday),
      formatted_date: formatLongDate(nextBday),
      weekday: getWeekdayName(nextBday),
      days_remaining: daysUntilNextBirthday,
      months_remaining: nextBdayMonths,
      extra_days_remaining: nextBdayRemDays,
      turning_age: turningAge,
    },
    birth_facts: {
      born_weekday: getWeekdayName(birth),
      formatted_birth_date: formatLongDate(birth),
      day_of_year: dayOfYear,
      is_leap_year: isLeapYear(birth.year),
      western_zodiac: zodiac.sign,
      zodiac_element: zodiac.element,
      ruling_planet: zodiac.ruling_planet,
      chinese_zodiac: getChineseZodiac(birth.year),
      generation: getGeneration(birth.year),
    },
    milestones,
    planetary_ages: planetaryAges,
  };
}

export function compareDatesFallback(
  firstBirthDate: string,
  secondBirthDate: string,
  firstName = 'Person A',
  secondName = 'Person B'
): AgeComparisonResult {
  const d1 = parseIsoDate(firstBirthDate, 'first_birth_date');
  const d2 = parseIsoDate(secondBirthDate, 'second_birth_date');

  const isSame = d1.utcMs === d2.utcMs;
  const olderDate = d1.utcMs <= d2.utcMs ? toIsoString(d1) : toIsoString(d2);
  const youngerDate = d1.utcMs <= d2.utcMs ? toIsoString(d2) : toIsoString(d1);
  const olderName = d1.utcMs <= d2.utcMs ? firstName : secondName;
  const youngerName = d1.utcMs <= d2.utcMs ? secondName : firstName;

  const diffCalc = calculateAgeFallback(olderDate, youngerDate);
  return {
    engine: 'FastAPI Python 3.10 Chronos Engine',
    older_person: isSame ? 'Exact Same Date' : olderName,
    younger_person: isSame ? 'Exact Same Date' : youngerName,
    is_same_date: isSame,
    difference: diffCalc.chronological,
    total_days_apart: diffCalc.totals.total_days,
    total_weeks_apart: diffCalc.totals.total_weeks,
    total_hours_apart: diffCalc.totals.total_hours,
  };
}
