'use client';

import React, {useState, useEffect} from 'react';
import {Calculator, RotateCcw, BookmarkPlus, AlertCircle, Sun, Moon} from 'lucide-react';
import {
  calculateAgeFallback,
  type AgeCalculationResult,
} from '@/lib/age-calculator';
import {AgeBreakdownPanel} from '@/components/AgeBreakdownPanel';
import {
  CompareAndProfilesPanel,
  type SavedAgeProfile,
} from '@/components/CompareAndProfilesPanel';

const DEFAULT_BIRTH_DATE = '1996-05-14';
const DEFAULT_TARGET_DATE = '2026-10-31';
const DEFAULT_BIRTH_TIME = '08:30';

const INITIAL_SAVED_PROFILES: SavedAgeProfile[] = [
  {
    id: 'prof-1',
    label: 'Alex Rivera',
    birth_date: '1996-05-14',
    birth_time: '08:30',
    summary_age: '30y 5m 17d',
    total_days: 11127,
  },
  {
    id: 'prof-2',
    label: 'Ada Lovelace (Historical)',
    birth_date: '1985-12-10',
    birth_time: '12:00',
    summary_age: '40y 10m 21d',
    total_days: 14935,
  },
  {
    id: 'prof-3',
    label: 'Leap Year Cohort',
    birth_date: '2004-02-29',
    birth_time: '06:15',
    summary_age: '22y 8m 2d',
    total_days: 8280,
  },
];

const QUICK_PRESETS = [
  {label: 'May 14, 1996', birth_date: '1996-05-14', birth_time: '08:30'},
  {label: 'Jan 01, 2000 (Y2K)', birth_date: '2000-01-01', birth_time: '00:00'},
  {label: 'Feb 29, 2004 (Leap Day)', birth_date: '2004-02-29', birth_time: '09:00'},
  {label: 'Jul 20, 1969 (Apollo 11)', birth_date: '1969-07-20', birth_time: '20:17'},
];

export default function HomePage() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [birthDate, setBirthDate] = useState<string>(DEFAULT_BIRTH_DATE);
  const [targetDate, setTargetDate] = useState<string>(DEFAULT_TARGET_DATE);
  const [birthTime, setBirthTime] = useState<string>(DEFAULT_BIRTH_TIME);
  const [profileLabelInput, setProfileLabelInput] = useState<string>('Alex Rivera');
  const [activeProfileLabel, setActiveProfileLabel] = useState<string>('Alex Rivera');

  const [result, setResult] = useState<AgeCalculationResult>(() =>
    calculateAgeFallback(DEFAULT_BIRTH_DATE, DEFAULT_TARGET_DATE, DEFAULT_BIRTH_TIME)
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [savedProfiles, setSavedProfiles] =
    useState<SavedAgeProfile[]>(INITIAL_SAVED_PROFILES);
  const [saveFeedback, setSaveFeedback] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('chronos-theme', theme);
    } catch {
      // Ignore storage restrictions
    }
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const runCalculation = async (
    nextBirthDate: string,
    nextTargetDate: string,
    nextBirthTime: string,
    labelOverride?: string
  ) => {
    setErrorMessage(null);

    if (!nextBirthDate.trim()) {
      setErrorMessage('Please enter a valid date of birth.');
      return;
    }
    if (!nextTargetDate.trim()) {
      setErrorMessage('Please enter a valid target calculation date.');
      return;
    }

    // Immediate client-side validation & instant calculation (<50ms feedback)
    try {
      const optimistic = calculateAgeFallback(
        nextBirthDate,
        nextTargetDate,
        nextBirthTime || '00:00'
      );
      setResult(optimistic);
      if (labelOverride !== undefined) {
        setActiveProfileLabel(labelOverride);
      } else {
        setActiveProfileLabel(profileLabelInput.trim());
      }
    } catch (validationErr: unknown) {
      const msg =
        validationErr instanceof Error
          ? validationErr.message
          : 'Date of birth cannot be after the target calculation date.';
      setErrorMessage(msg);
      return;
    }

    // Confirm and sync authoritative calculation from Python FastAPI backend (/api/calculate)
    setIsLoading(true);
    try {
      const response = await fetch('/api/calculate', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          birth_date: nextBirthDate,
          target_date: nextTargetDate,
          birth_time: nextBirthTime || '00:00',
        }),
      });
      const data = await response.json();
      if (!response.ok || data.detail) {
        setErrorMessage(
          data.detail || 'Date of birth cannot be after the target calculation date.'
        );
      } else {
        setResult(data);
      }
    } catch {
      // Keep optimistic calculation if network is momentarily busy
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await runCalculation(birthDate, targetDate, birthTime);
  };

  const handleResetToDefaults = async () => {
    setBirthDate(DEFAULT_BIRTH_DATE);
    setTargetDate(DEFAULT_TARGET_DATE);
    setBirthTime(DEFAULT_BIRTH_TIME);
    setProfileLabelInput('Alex Rivera');
    await runCalculation(
      DEFAULT_BIRTH_DATE,
      DEFAULT_TARGET_DATE,
      DEFAULT_BIRTH_TIME,
      'Alex Rivera'
    );
  };

  const handleSaveCurrentProfile = () => {
    const label =
      profileLabelInput.trim() || `Profile (${result.input.birth_date})`;
    const summaryAge = `${result.chronological.years}y ${result.chronological.months}m ${result.chronological.days}d`;
    const newProfile: SavedAgeProfile = {
      id: `prof-${Date.now()}`,
      label,
      birth_date: result.input.birth_date,
      birth_time: result.input.birth_time,
      summary_age: summaryAge,
      total_days: result.totals.total_days,
    };
    setSavedProfiles((prev) => [newProfile, ...prev]);
    setActiveProfileLabel(label);
    setSaveFeedback(`Saved "${label}" to directory`);
    setTimeout(() => setSaveFeedback(null), 2500);
  };

  const handleSelectProfile = async (profile: SavedAgeProfile) => {
    setBirthDate(profile.birth_date);
    setBirthTime(profile.birth_time);
    setProfileLabelInput(profile.label);
    await runCalculation(
      profile.birth_date,
      targetDate,
      profile.birth_time,
      profile.label
    );
  };

  const handleDeleteProfile = (id: string) => {
    setSavedProfiles((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Strict 3-Zone Top Bar Contract */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8 px-6 py-4">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#calculator"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
            style={{fontFamily: 'var(--font-display), sans-serif'}}
          >
            Chronos
          </a>

          {/* Zone 2: 4 concise single-line text navigation links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400"
          >
            <a
              href="#calculator"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Calculator
            </a>
            <a
              href="#time-units"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Time Units
            </a>
            <a
              href="#compare"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Compare
            </a>
            <a
              href="#saved-profiles"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Saved Profiles
            </a>
          </nav>

          {/* Zone 3: 1 primary action (Theme Switcher) */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={handleToggleTheme}
              aria-label={
                theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'
              }
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container (1440px desktop baseline with max-w-7xl) */}
      <main id="calculator" className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 sm:py-10 space-y-10">
        {/* Hero Header */}
        <div className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>Precision Chronometry</span>
            <span aria-hidden="true">·</span>
            <span>Exact Calendar Math</span>
            <span aria-hidden="true">·</span>
            <span>Date Comparison</span>
          </div>
          <h1
            className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
            style={{
              fontFamily: 'var(--font-display), sans-serif',
              textWrap: 'balance',
            }}
          >
            Chronos Age Calculator
          </h1>
          <p className="mt-2.5 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Compute exact calendar age down to the second, inspect cumulative time units and
            next-birthday countdowns, and compare birth dates with instant precision.
          </p>
        </div>

        {/* Workspace 2-Column Split: Left Input Form (4 cols) + Right Breakdown (8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Age Calculator Input Form */}
          <section
            aria-label="Age Calculation Input Parameters"
            className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-5 transition-colors duration-150"
          >
            <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                <h2
                  className="text-base font-semibold text-slate-900 dark:text-white"
                  style={{fontFamily: 'var(--font-display), sans-serif'}}
                >
                  Date Parameters
                </h2>
              </div>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Enter birth date and target reference date
              </p>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4" noValidate>
              <div>
                <label
                  htmlFor="profile-label-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Profile Label (Optional)
                </label>
                <input
                  id="profile-label-input"
                  type="text"
                  placeholder="e.g. Alex Rivera"
                  value={profileLabelInput}
                  onChange={(e) => setProfileLabelInput(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>

              <div>
                <label
                  htmlFor="birth-date-input"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Date of Birth
                </label>
                <input
                  id="birth-date-input"
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 dark:[color-scheme:dark]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="birth-time-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Birth Time (24h)
                  </label>
                  <input
                    id="birth-time-input"
                    type="time"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 dark:[color-scheme:dark]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="target-date-input"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                  >
                    Age As Of Date
                  </label>
                  <input
                    id="target-date-input"
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 dark:[color-scheme:dark]"
                  />
                </div>
              </div>

              {errorMessage ? (
                <div
                  role="alert"
                  data-testid="calculation-error-alert"
                  className="flex items-start gap-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg px-3.5 py-2.5"
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              ) : null}

              {saveFeedback ? (
                <div
                  role="status"
                  className="text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900/60 rounded-lg px-3.5 py-2"
                >
                  {saveFeedback}
                </div>
              ) : null}

              <div className="pt-1 flex flex-col gap-2.5">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
                >
                  {isLoading ? 'Calculating...' : 'Calculate Age'}
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleSaveCurrentProfile}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <BookmarkPlus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Save Profile</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetToDefaults}
                    className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                    <span>Reset Form</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Quick Sample Date Presets */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5">
                Quick Reference Dates
              </div>
              <div className="grid grid-cols-1 gap-1.5">
                {QUICK_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setBirthDate(preset.birth_date);
                      setBirthTime(preset.birth_time);
                      setProfileLabelInput(preset.label);
                      runCalculation(
                        preset.birth_date,
                        targetDate,
                        preset.birth_time,
                        preset.label
                      );
                    }}
                    className="flex items-center justify-between px-3 py-1.5 text-xs text-left text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <span className="font-medium truncate">{preset.label}</span>
                    <span className="font-mono tabular-nums text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                      {preset.birth_date}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Right Column: Primary Breakdown Readout */}
          <div className="lg:col-span-8">
            <AgeBreakdownPanel result={result} profileLabel={activeProfileLabel} />
          </div>
        </div>

        {/* Compare Two Dates & Saved Profiles Directory */}
        <CompareAndProfilesPanel
          savedProfiles={savedProfiles}
          onSelectProfile={handleSelectProfile}
          onDeleteProfile={handleDeleteProfile}
          onAddPresetProfile={() => setSavedProfiles(INITIAL_SAVED_PROFILES)}
        />
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mt-12 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-6 py-6 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
          Built by Rajdeep Chakraborty(
          <a
            href="https://github.com/nemesisrc/chronos-age-calculator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline underline-offset-4"
          >
            https://github.com/nemesisrc/chronos-age-calculator
          </a>
          )
        </div>
      </footer>
    </div>
  );
}
