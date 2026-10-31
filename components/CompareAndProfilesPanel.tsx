'use client';

import React, {useState} from 'react';
import {Users, Bookmark, Trash2, ArrowUpRight, Search, AlertCircle} from 'lucide-react';
import {compareDatesFallback, type AgeComparisonResult} from '@/lib/age-calculator';

export interface SavedAgeProfile {
  id: string;
  label: string;
  birth_date: string;
  birth_time: string;
  summary_age: string;
  total_days: number;
}

interface CompareAndProfilesPanelProps {
  savedProfiles: SavedAgeProfile[];
  onSelectProfile: (profile: SavedAgeProfile) => void;
  onDeleteProfile: (id: string) => void;
  onAddPresetProfile: () => void;
}

export function CompareAndProfilesPanel({
  savedProfiles,
  onSelectProfile,
  onDeleteProfile,
  onAddPresetProfile,
}: CompareAndProfilesPanelProps) {
  const [firstName, setFirstName] = useState<string>('Elena Vance');
  const [firstDate, setFirstDate] = useState<string>('1992-03-10');
  const [secondName, setSecondName] = useState<string>('Marcus Sterling');
  const [secondDate, setSecondDate] = useState<string>('1996-05-14');
  const [comparison, setComparison] = useState<AgeComparisonResult | null>(() =>
    compareDatesFallback('1992-03-10', '1996-05-14', 'Elena Vance', 'Marcus Sterling')
  );
  const [compareError, setCompareError] = useState<string | null>(null);
  const [isComparing, setIsComparing] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const handleCompareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompareError(null);

    if (!firstDate || !secondDate) {
      setCompareError('Both dates of birth are required to calculate the age difference.');
      return;
    }

    try {
      const optimistic = compareDatesFallback(
        firstDate,
        secondDate,
        firstName.trim() || 'Person A',
        secondName.trim() || 'Person B'
      );
      setComparison(optimistic);
    } catch (err: unknown) {
      setCompareError(
        err instanceof Error ? err.message : 'Could not compare the provided dates.'
      );
      return;
    }

    setIsComparing(true);
    try {
      const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          first_birth_date: firstDate,
          second_birth_date: secondDate,
          first_name: firstName.trim() || 'Person A',
          second_name: secondName.trim() || 'Person B',
        }),
      });
      const data = await response.json();
      if (!response.ok || data.detail) {
        setCompareError(data.detail || 'Could not compare dates.');
      } else {
        setComparison(data);
      }
    } catch {
      // Keep optimistic comparison result
    } finally {
      setIsComparing(false);
    }
  };

  const filteredProfiles = savedProfiles.filter(
    (p) =>
      p.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.birth_date.includes(searchQuery)
  );

  return (
    <div id="compare" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Two-Date Age Difference Calculator */}
      <section
        aria-label="Age Difference Calculator"
        className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between transition-colors duration-150"
      >
        <div>
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <h3
                className="text-base font-semibold text-slate-900 dark:text-white"
                style={{fontFamily: 'var(--font-display), sans-serif'}}
              >
                Compare Two Birth Dates
              </h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Compute the exact chronological gap between two individuals
            </p>
          </div>

          <form onSubmit={handleCompareSubmit} className="mt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="compare-first-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  First Person Name
                </label>
                <input
                  id="compare-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="compare-first-date"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  First Birth Date
                </label>
                <input
                  id="compare-first-date"
                  type="date"
                  value={firstDate}
                  onChange={(e) => setFirstDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 dark:[color-scheme:dark]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="compare-second-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Second Person Name
                </label>
                <input
                  id="compare-second-name"
                  type="text"
                  value={secondName}
                  onChange={(e) => setSecondName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="compare-second-date"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Second Birth Date
                </label>
                <input
                  id="compare-second-date"
                  type="date"
                  value={secondDate}
                  onChange={(e) => setSecondDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 font-mono tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900 dark:[color-scheme:dark]"
                />
              </div>
            </div>

            {compareError ? (
              <div
                role="alert"
                className="flex items-center gap-2 text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900/60 rounded-lg px-3 py-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{compareError}</span>
              </div>
            ) : null}

            <div className="pt-1">
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold text-white dark:text-slate-900 bg-slate-900 dark:bg-slate-100 rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors whitespace-nowrap shrink-0"
              >
                {isComparing ? 'Calculating...' : 'Compare Age Gap'}
              </button>
            </div>
          </form>
        </div>

        {comparison ? (
          <div
            data-testid="comparison-result-panel"
            className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800"
          >
            <div className="text-xs text-slate-500 dark:text-slate-400">
              {comparison.is_same_date ? (
                <span>Both individuals share the exact same birth date.</span>
              ) : (
                <span>
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                    {comparison.older_person}
                  </strong>{' '}
                  is older than{' '}
                  <strong className="text-slate-900 dark:text-slate-100 font-semibold">
                    {comparison.younger_person}
                  </strong>{' '}
                  by:
                </span>
              )}
            </div>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <div className="text-2xl font-bold text-slate-900 dark:text-white font-mono tabular-nums">
                {comparison.difference.years}y {comparison.difference.months}m{' '}
                {comparison.difference.days}d
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                {comparison.total_days_apart.toLocaleString('en-US')} days ·{' '}
                {comparison.total_weeks_apart.toLocaleString('en-US')} weeks ·{' '}
                {comparison.total_hours_apart.toLocaleString('en-US')} hours apart
              </div>
            </div>
          </div>
        ) : null}
      </section>

      {/* Saved Profiles Directory */}
      <section
        id="saved-profiles"
        aria-label="Saved Profiles Directory"
        className="lg:col-span-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between transition-colors duration-150"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <div>
                <h3
                  className="text-base font-semibold text-slate-900 dark:text-white"
                  style={{fontFamily: 'var(--font-display), sans-serif'}}
                >
                  Saved Profiles & Cohorts
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Quick-load saved birth dates into the calculator
                </p>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                aria-label="Filter saved profiles"
                placeholder="Filter profiles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-900"
              />
            </div>
          </div>

          {filteredProfiles.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No matching profiles found
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Save a calculation from the main form or load sample cohort entries.
              </p>
              <button
                type="button"
                onClick={onAddPresetProfile}
                className="mt-4 px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0"
              >
                Restore Sample Profiles
              </button>
            </div>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400">
                    <th className="py-2 pr-3">Profile</th>
                    <th className="py-2 px-3">Birth Date</th>
                    <th className="py-2 px-3 text-right">Age Summary</th>
                    <th className="py-2 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredProfiles.map((profile) => (
                    <tr
                      key={profile.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-2.5 pr-3 font-medium text-slate-900 dark:text-slate-100">
                        {profile.label}
                      </td>
                      <td className="py-2.5 px-3 font-mono tabular-nums text-xs text-slate-600 dark:text-slate-400">
                        {profile.birth_date}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-slate-800 dark:text-slate-200">
                        {profile.summary_age}
                      </td>
                      <td className="py-2.5 pl-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onSelectProfile(profile)}
                            aria-label={`Load ${profile.label}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-md transition-colors whitespace-nowrap shrink-0"
                          >
                            <span>Load</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteProfile(profile.id)}
                            aria-label={`Delete ${profile.label}`}
                            className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded-md transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
