import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { userId, friendId } = await req.json();

    if (!userId || !friendId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove the friendship relationship and clean up any existing friend requests
    await prisma.$transaction([
      // Remove friendship in both directions
      prisma.user.update({
        where: { id: userId },
        data: {
          friends: {
            disconnect: { id: friendId },
          },
        },
      }),
      prisma.user.update({
        where: { id: friendId },
        data: {
          friends: {
            disconnect: { id: userId },
          },
        },
      }),
      // Delete any existing friend requests between the users (in both directions)
      prisma.friendRequest.deleteMany({
        where: {
          OR: [
            { senderId: userId, receiverId: friendId },
            { senderId: friendId, receiverId: userId }
          ]
        }
      })
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unfriend error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
