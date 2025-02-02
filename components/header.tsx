import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
}

interface FriendRequest {
  id: string;
  sender: User;
}

export default function Header() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Fetch friend requests
  useEffect(() => {
    if (!currentUser) return;

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(`/api/friends/request/get?userId=${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setFriendRequests(data);
      } catch (error) {
        console.error('Fetch friend requests error:', error);
      }
    };

    fetchFriendRequests();
    const interval = setInterval(fetchFriendRequests, 10000);

    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const handleFriendRequest = async (requestId: string, status: 'ACCEPTED' | 'REJECTED') => {
    try {
      const response = await fetch('/api/friends/request', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          status,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to handle friend request');
      }

      // Remove the request from the list
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );

      toast({
        title: 'Success',
        description: status === 'ACCEPTED' 
          ? 'Friend request accepted!' 
          : 'Friend request declined',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to handle friend request',
        variant: 'destructive',
      });
    }
  };

  if (!currentUser) return null;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Link href="/friends" className="text-xl font-bold">
            Chat App
          </Link>

          <div className="flex items-center gap-4">
            {/* Friend Request Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative">
                  <Bell className="h-5 w-5" />
                  {friendRequests.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {friendRequests.length}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                {friendRequests.length === 0 ? (
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    No new friend requests
                  </div>
                ) : (
                  friendRequests.map((request) => (
                    <div key={request.id} className="p-4 border-b last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Avatar>
                          <AvatarImage src={request.sender.profileImage || undefined} />
                          <AvatarFallback>
                            {request.sender.username[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{request.sender.username}</p>
                          <p className="text-sm text-muted-foreground">
                            wants to be your friend
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={() => handleFriendRequest(request.id, 'ACCEPTED')}
                        >
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          onClick={() => handleFriendRequest(request.id, 'REJECTED')}
                        >
                          Decline
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar>
                    <AvatarImage src={currentUser.profileImage || undefined} />
                    <AvatarFallback>
                      {currentUser.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="font-medium">
                  {currentUser.username}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
