import {NextRequest, NextResponse} from 'next/server';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {calculateAgeFallback} from '@/lib/age-calculator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const birthDate = typeof body.birth_date === 'string' ? body.birth_date.trim() : '';
    const targetDate =
      typeof body.target_date === 'string' && body.target_date.trim().length > 0
        ? body.target_date.trim()
        : undefined;
    const birthTime =
      typeof body.birth_time === 'string' && body.birth_time.trim().length > 0
        ? body.birth_time.trim()
        : '00:00';

    if (!birthDate) {
      return NextResponse.json(
        {detail: 'Please provide a valid date of birth (YYYY-MM-DD).'},
        {status: 422}
      );
    }

    // Execute Python 3 FastAPI backend script (`backend/main.py`) first
    try {
      const scriptPath = path.join(process.cwd(), 'backend', 'main.py');
      const payloadArg = JSON.stringify({
        birth_date: birthDate,
        target_date: targetDate,
        birth_time: birthTime,
      });
      const stdout = execFileSync('python3', [scriptPath, '--calculate', payloadArg], {
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
      // Check if python exited with code 1 and printed a structured JSON validation error
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
          // Fall through to TypeScript engine
        }
      }
    }

    // Fallback to identical TypeScript engine if Python binary is unavailable
    const fallbackResult = calculateAgeFallback(birthDate, targetDate, birthTime);
    return NextResponse.json(fallbackResult, {status: 200});
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Unable to process age calculation request.';
    return NextResponse.json({detail: message}, {status: 422});
  }
}
