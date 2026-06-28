import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

function isAuthenticated(req: Request) {
  const authHeader = req.headers.get('authorization');
  const apiKey = process.env.API_SECRET_KEY;
  if (!apiKey) return true;
  return authHeader === `Bearer ${apiKey}`;
}

export async function GET(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userId = user?.id;
    if (!userId) {
      const { data: logs } = await supabase.from('mental_logs').select('user_id').limit(1);
      if (logs && logs.length > 0) {
        userId = logs[0].user_id;
      } else {
        return NextResponse.json({ data: [] });
      }
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '7');

    const { data: mentalLogs } = await supabase
      .from('mental_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    return NextResponse.json({ data: mentalLogs || [] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, data: [] }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!isAuthenticated(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { level } = body;

    if (!level || typeof level !== 'number' || level < 1 || level > 5) {
      return NextResponse.json({ error: 'Invalid level. Must be a number between 1 and 5' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    let userId = user?.id;
    if (!userId) {
      const { data: logs } = await supabase.from('mental_logs').select('user_id').limit(1);
      if (logs && logs.length > 0) {
        userId = logs[0].user_id;
      } else {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
    }

    const { error: dbError } = await supabase.from('mental_logs').insert({
      user_id: userId,
      level: level
    });
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
