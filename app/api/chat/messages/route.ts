import { prisma } from '@/lib/db/prisma';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const senderId = searchParams.get('senderId');
    const receiverId = searchParams.get('receiverId');

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get messages between the two users
    const messages = await prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId, receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
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
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Mark all messages as read
    await prisma.chatMessage.updateMany({
      where: {
        senderId: receiverId,
        receiverId: senderId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { content, senderId, receiverId } = await req.json();

    if (!content || !senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create new message
    const message = await prisma.chatMessage.create({
      data: {
        content,
        senderId,
        receiverId,
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

    return NextResponse.json(message);
  } catch (error) {
    console.error('Create message error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
