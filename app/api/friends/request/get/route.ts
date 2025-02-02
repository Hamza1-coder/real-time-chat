import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const friendRequests = await prisma.friendRequest.findMany({
      where: {
        receiverId: userId,
        status: 'PENDING',
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            email: true,
            profileImage: true,
          },
        },
        receiver: {
          select: {
            id: true,
            username: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json(friendRequests);
  } catch (error) {
    console.error('Get friend requests error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
