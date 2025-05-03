import { NextResponse } from 'next/server';
import { db } from '@/database/db';
import { snacks } from '@/database/schema';
import { eq } from 'drizzle-orm';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // 删除零食
    await db.delete(snacks).where(eq(snacks.id, id));

    return NextResponse.json({ message: 'Snack deleted successfully' });
  } catch (error) {
    console.error('Error deleting snack:', error);
    return NextResponse.json(
      { error: 'Failed to delete snack' },
      { status: 500 }
    );
  }
} 