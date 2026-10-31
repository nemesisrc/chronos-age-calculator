import {NextRequest, NextResponse} from 'next/server';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {compareDatesFallback} from '@/lib/age-calculator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const firstBirthDate =
      typeof body.first_birth_date === 'string' ? body.first_birth_date.trim() : '';
    const secondBirthDate =
      typeof body.second_birth_date === 'string' ? body.second_birth_date.trim() : '';
    const firstName =
      typeof body.first_name === 'string' && body.first_name.trim().length > 0
        ? body.first_name.trim()
        : 'Person A';
    const secondName =
      typeof body.second_name === 'string' && body.second_name.trim().length > 0
        ? body.second_name.trim()
        : 'Person B';

    if (!firstBirthDate || !secondBirthDate) {
      return NextResponse.json(
        {detail: 'Please provide both dates of birth to compare.'},
        {status: 422}
      );
    }

    try {
      const scriptPath = path.join(process.cwd(), 'backend', 'main.py');
      const payloadArg = JSON.stringify({
        first_birth_date: firstBirthDate,
        second_birth_date: secondBirthDate,
        first_name: firstName,
        second_name: secondName,
      });
      const stdout = execFileSync('python3', [scriptPath, '--compare', payloadArg], {
        encoding: 'utf-8',
        timeout: 4000,
      });
      const parsed = JSON.parse(stdout);
      if (parsed.ok && parsed.data) {
        return NextResponse.json(parsed.data, {status: 200});
      }
      if (parsed.error) {
        return NextResponse.json({detail: parsed.error}, {status: 422});
      }
    } catch (pyErr: unknown) {
      if (
        pyErr &&
        typeof pyErr === 'object' &&
        'stdout' in pyErr &&
        typeof (pyErr as {stdout?: unknown}).stdout === 'string'
      ) {
        try {
          const errOut = JSON.parse((pyErr as {stdout: string}).stdout);
          if (errOut && errOut.error) {
            return NextResponse.json({detail: errOut.error}, {status: 422});
          }
        } catch {
          // Fall through
        }
      }
    }

    const fallback = compareDatesFallback(
      firstBirthDate,
      secondBirthDate,
      firstName,
      secondName
    );
    return NextResponse.json(fallback, {status: 200});
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to compare the provided dates.';
    return NextResponse.json({detail: message}, {status: 422});
  }
}
