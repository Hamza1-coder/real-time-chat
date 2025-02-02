import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

// Send friend request
export async function POST(req: Request) {
  try {
    const { senderId, receiverId } = await req.json();

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if users exist
    const [sender, receiver] = await Promise.all([
      prisma.user.findUnique({
        where: { id: senderId },
        include: { friends: true }
      }),
      prisma.user.findUnique({
        where: { id: receiverId },
        include: { friends: true }
      })
    ]);

    if (!sender || !receiver) {
      return NextResponse.json(
        { error: 'One or both users not found' },
        { status: 404 }
      );
    }

    // Check if they are already friends
    const alreadyFriends = sender.friends.some(friend => friend.id === receiverId);
    if (alreadyFriends) {
      return NextResponse.json(
        { error: 'Users are already friends' },
        { status: 400 }
      );
    }

    // Delete any existing friend requests between the users (in both directions)
    await prisma.friendRequest.deleteMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }
    });

    // Create new friend request
    const friendRequest = await prisma.friendRequest.create({
      data: {
        senderId,
        receiverId,
        status: 'PENDING'
      },
      include: {
        sender: true,
        receiver: true
      }
    });

    return NextResponse.json(friendRequest);
  } catch (error) {
    console.error('Create friend request error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// Handle friend request (accept/reject)
export async function PATCH(req: Request) {
  try {
    const { requestId, status } = await req.json();

    if (!requestId || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const friendRequest = await prisma.friendRequest.findUnique({
      where: { id: requestId },
      include: {
        sender: true,
        receiver: true,
      },
    });

    if (!friendRequest) {
      return NextResponse.json(
        { error: 'Friend request not found' },
        { status: 404 }
      );
    }

    if (status === 'ACCEPTED') {
      // Create friendship relationship
      await prisma.$transaction([
        // Update friend request status
        prisma.friendRequest.update({
          where: { id: requestId },
          data: { status },
        }),
        // Add friendship relationships
        prisma.user.update({
          where: { id: friendRequest.senderId },
          data: {
            friends: {
              connect: { id: friendRequest.receiverId },
            },
          },
        }),
        prisma.user.update({
          where: { id: friendRequest.receiverId },
          data: {
            friends: {
              connect: { id: friendRequest.senderId },
            },
          },
        }),
      ]);
    } else {
      // Just update the status for rejected requests
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status },
      });
    }

    return NextResponse.json(friendRequest);
  } catch (error) {
    console.error('Update friend request error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
