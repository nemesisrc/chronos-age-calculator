'use client';

import React, {useState, useEffect} from 'react';
import {Clock, Gift, Check, Copy} from 'lucide-react';
import type {AgeCalculationResult} from '@/lib/age-calculator';

interface AgeBreakdownPanelProps {
  result: AgeCalculationResult;
  profileLabel?: string;
}

export function AgeBreakdownPanel({result, profileLabel}: AgeBreakdownPanelProps) {
  const [liveTick, setLiveTick] = useState<boolean>(true);
  const inputSignature = `${result.input.birth_date}|${result.input.target_date}|${result.input.birth_time}`;
  const [tickState, setTickState] = useState<{signature: string; count: number}>({
    signature: inputSignature,
    count: 0,
  });
  const [copiedSummary, setCopiedSummary] = useState<boolean>(false);

  useEffect(() => {
    if (!liveTick) return;
    const interval = setInterval(() => {
      setTickState((prev) =>
        prev.signature === inputSignature
          ? {signature: inputSignature, count: prev.count + 1}
          : {signature: inputSignature, count: 1}
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [inputSignature, liveTick]);

  const {chronological, totals, next_birthday, birth_facts, input} = result;
  const elapsedSeconds = tickState.signature === inputSignature ? tickState.count : 0;
  const displayedSeconds = totals.total_seconds + (liveTick ? elapsedSeconds : 0);

  const handleCopySummary = () => {
    const summaryText = [
      `Chronos Age Report${profileLabel ? ` — ${profileLabel}` : ''}`,
      `Born: ${birth_facts.formatted_birth_date} (${birth_facts.born_weekday})`,
      `As of: ${input.target_date}`,
      `Exact Age: ${chronological.years} years, ${chronological.months} months, ${chronological.days} days`,
      `Total Days: ${totals.total_days.toLocaleString('en-US')} days (${totals.total_hours.toLocaleString('en-US')} hours)`,
      `Next Birthday: ${next_birthday.formatted_date} (${next_birthday.days_remaining} days remaining)`,
    ].join('\n');

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(summaryText).catch(() => {});
    }
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Calculate percentage of current year of life completed
  const daysIntoCurrentYear = Math.max(0, 365 - next_birthday.days_remaining);
  const yearProgressPercent = Math.min(100, Math.round((daysIntoCurrentYear / 365) * 100));

  return (
    <div className="space-y-8">
      {/* Primary Chronological Age Readout */}
      <section
        aria-label="Chronological Age Summary"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8 transition-colors duration-150"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>Chronological Breakdown</span>
              <span aria-hidden="true">·</span>
              <span>Born {birth_facts.formatted_birth_date}</span>
              <span aria-hidden="true">·</span>
              <span>As of {input.target_date}</span>
              {profileLabel ? (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    {profileLabel}
                  </span>
                </>
              ) : null}
            </div>
            <h2
              className="mt-1.5 text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
              style={{fontFamily: 'var(--font-display), sans-serif'}}
            >
              {chronological.is_birthday_today
                ? `Happy ${chronological.years}th Birthday!`
                : 'Exact Calendar Age'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLiveTick((prev) => !prev)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 ${
                liveTick
                  ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
              }`}
            >
              {liveTick ? 'Pause Seconds Counter' : 'Resume Seconds Counter'}
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              {copiedSummary ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Copied Report</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>Copy Summary</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Big 3 Chronological Figures */}
        <div
          data-testid="chronological-age-grid"
          className="grid grid-cols-3 gap-4 sm:gap-8 py-8 border-b border-slate-100 dark:border-slate-800"
        >
          <div>
            <div
              data-testid="age-years-value"
              className="text-4xl sm:text-6xl font-bold tracking-tight text-blue-600 dark:text-blue-400 font-mono tabular-nums"
            >
              {chronological.years}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              {chronological.years === 1 ? 'Year' : 'Years'}
            </div>
          </div>

          <div className="border-l border-slate-100 dark:border-slate-800 pl-4 sm:pl-8">
            <div
              data-testid="age-months-value"
              className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums"
            >
              {chronological.months}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              {chronological.months === 1 ? 'Month' : 'Months'}
            </div>
          </div>

          <div className="border-l border-slate-100 dark:border-slate-800 pl-4 sm:pl-8">
            <div
              data-testid="age-days-value"
              className="text-4xl sm:text-6xl font-bold tracking-tight text-slate-900 dark:text-white font-mono tabular-nums"
            >
              {chronological.days}
            </div>
            <div className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-400">
              {chronological.days === 1 ? 'Day' : 'Days'}
            </div>
          </div>
        </div>

        {/* Unboxed Birth Context Metadata Line */}
        <div className="pt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span>
              Born on a{' '}
              <strong className="font-semibold text-slate-900 dark:text-slate-100">
                {birth_facts.born_weekday}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Day{' '}
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {birth_facts.day_of_year}
              </strong>{' '}
              of {input.birth_date.slice(0, 4)}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              <strong className="font-mono tabular-nums text-slate-900 dark:text-slate-100">
                {totals.leap_days_experienced}
              </strong>{' '}
              leap days experienced
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {birth_facts.is_leap_year ? 'Born in a Leap Year' : 'Standard Calendar Year'}
            </span>
          </div>
        </div>
      </section>

      {/* Total Time Units & Next Birthday Split */}
      <div id="time-units" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Total Time Equivalents Table */}
        <section
          aria-label="Total Time Units Lived"
          className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between transition-colors duration-150"
        >
          <div>
            <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h3
                  className="text-base font-semibold text-slate-900 dark:text-white"
                  style={{fontFamily: 'var(--font-display), sans-serif'}}
                >
                  Cumulative Time Equivalents
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Single-unit conversions
              </span>
            </div>

            <dl className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
              <div className="py-3 flex items-baseline justify-between gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400">Total Months</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {totals.total_months.toLocaleString('en-US')} months, {chronological.days} days
                </dd>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400">Total Weeks</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {totals.total_weeks.toLocaleString('en-US')} weeks,{' '}
                  {totals.remaining_days_after_weeks} days
                </dd>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400">
                  Total Calendar Days
                </dt>
                <dd
                  data-testid="total-days-value"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-mono tabular-nums"
                >
                  {totals.total_days.toLocaleString('en-US')} days
                </dd>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400">Total Hours</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {totals.total_hours.toLocaleString('en-US')} hours
                </dd>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400">Total Minutes</dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {totals.total_minutes.toLocaleString('en-US')} minutes
                </dd>
              </div>
              <div className="py-3 flex items-baseline justify-between gap-4">
                <dt className="text-sm text-slate-600 dark:text-slate-400">
                  Total Seconds {liveTick ? '(Live Offset)' : ''}
                </dt>
                <dd className="text-sm font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                  {displayedSeconds.toLocaleString('en-US')} seconds
                </dd>
              </div>
            </dl>
          </div>
        </section>

        {/* Next Birthday Countdown */}
        <section
          aria-label="Next Birthday Countdown"
          className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6 transition-colors duration-150"
        >
          <div>
            <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 min-w-0">
                <Gift className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h3
                  className="text-base font-semibold text-slate-900 dark:text-white whitespace-nowrap truncate"
                  style={{fontFamily: 'var(--font-display), sans-serif'}}
                >
                  Next Birthday
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono tabular-nums whitespace-nowrap shrink-0">
                Turning {next_birthday.turning_age}
              </span>
            </div>

            <div className="mt-5">
              <div className="flex items-baseline justify-between gap-2">
                <div
                  data-testid="next-birthday-days"
                  className="text-3xl font-bold text-slate-900 dark:text-white font-mono tabular-nums whitespace-nowrap"
                >
                  {next_birthday.days_remaining === 0
                    ? 'Today!'
                    : `${next_birthday.days_remaining} Days`}
                </div>
                <span className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                  {yearProgressPercent}% of year {chronological.years + 1}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">
                {next_birthday.months_remaining} months, {next_birthday.extra_days_remaining}{' '}
                days remaining · {next_birthday.formatted_date} ({next_birthday.weekday})
              </p>

              <div
                className="mt-3 w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden"
                role="progressbar"
                aria-valuenow={yearProgressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Current age year completion percentage"
              >
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500 transition-transform duration-200 origin-left"
                  style={{transform: `scaleX(${yearProgressPercent / 100})`}}
                />
              </div>
            </div>
          </div>

          <dl className="pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-y-3 gap-x-4 text-xs">
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Celebration Date</dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {next_birthday.formatted_date}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Day of the Week</dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100">
                {next_birthday.weekday}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Remaining Breakdown</dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {next_birthday.months_remaining}m {next_birthday.extra_days_remaining}d
              </dd>
            </div>
            <div>
              <dt className="text-slate-500 dark:text-slate-400">Upcoming Age</dt>
              <dd className="mt-0.5 font-semibold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
                {next_birthday.turning_age} years old
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
