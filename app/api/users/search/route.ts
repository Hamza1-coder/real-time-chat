import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('query');
    const currentUserId = searchParams.get('currentUserId');

    if (!query || !currentUserId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: query } },
              { email: { contains: query } },
            ],
          },
          {
            id: { not: currentUserId }, // Exclude current user
          },
        ],
      },
      select: {
        id: true,
        username: true,
        email: true,
        profileImage: true,
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
