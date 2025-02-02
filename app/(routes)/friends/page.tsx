'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/header';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  username: string;
  email: string;
  profileImage: string | null;
}

interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  sender: User;
  receiver: User;
}

export default function FriendsPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<User[]>([]);
  const { toast } = useToast();
  const router = useRouter();

  const handleMessageClick = (friendId: string) => {
    router.push(`/chat?friendId=${friendId}`);
  };

  // Get current user and fetch friend requests
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setCurrentUser(user);
    }
  }, []);

  // Fetch friend requests whenever currentUser changes
  useEffect(() => {
    if (!currentUser) return;

    const fetchFriendRequests = async () => {
      try {
        const response = await fetch(`/api/friends/request/get?userId=${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch friend requests');
        }

        setFriendRequests(data);
      } catch (error: any) {
        console.error('Fetch friend requests error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch friend requests',
          variant: 'destructive',
        });
      }
    };

    // Fetch friend requests immediately
    fetchFriendRequests();

    // Set up polling for new friend requests every 10 seconds
    const interval = setInterval(fetchFriendRequests, 10000);

    return () => clearInterval(interval);
  }, [currentUser, toast]);

  // Fetch friends list
  useEffect(() => {
    if (!currentUser) return;

    const fetchFriends = async () => {
      try {
        const response = await fetch(`/api/friends/list?userId=${currentUser.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch friends');
        }

        setFriends(data);
      } catch (error: any) {
        console.error('Fetch friends error:', error);
        toast({
          title: 'Error',
          description: error.message || 'Failed to fetch friends',
          variant: 'destructive',
        });
      }
    };

    fetchFriends();
  }, [currentUser, toast]);

  const handleSearch = async () => {
    if (!currentUser || !searchQuery.trim()) return;

    try {
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(searchQuery)}&currentUserId=${currentUser.id}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search users');
      }

      setSearchResults(data);
    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to search users',
        variant: 'destructive',
      });
    }
  };

  const sendFriendRequest = async (receiverId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/friends/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send friend request');
      }

      toast({
        title: 'Success',
        description: 'Friend request sent!',
      });

      // Remove user from search results
      setSearchResults((prev) =>
        prev.filter((user) => user.id !== receiverId)
      );
    } catch (error: any) {
      console.error('Send friend request error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive',
      });
    }
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to handle friend request');
      }

      // Remove the request from the list
      setFriendRequests((prev) =>
        prev.filter((request) => request.id !== requestId)
      );

      // If accepted, add to friends list
      if (status === 'ACCEPTED') {
        const newFriend = data.sender.id === currentUser?.id ? data.receiver : data.sender;
        setFriends((prev) => [...prev, newFriend]);
        
        toast({
          title: 'Success',
          description: 'Friend request accepted!',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Friend request declined',
        });
      }
    } catch (error: any) {
      console.error('Handle friend request error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to handle friend request',
        variant: 'destructive',
      });
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!currentUser) return;

    try {
      const response = await fetch('/api/friends/unfriend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          friendId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to unfriend user');
      }

      // Remove friend from the list
      setFriends((prev) =>
        prev.filter((friend) => friend.id !== friendId)
      );

      toast({
        title: 'Success',
        description: 'Friend removed successfully',
      });
    } catch (error: any) {
      console.error('Unfriend error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to unfriend user',
        variant: 'destructive',
      });
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-lg">Loading...</p>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="container mx-auto p-4 space-y-6">
        {/* Search Card */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Find Friends</h2>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                placeholder="Search by username or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch}>Search</Button>
            </div>
            
            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={user.profileImage || undefined} />
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.username}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline"
                      onClick={() => sendFriendRequest(user.id)}
                    >
                      Add Friend
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Friend Requests Card */}
        {friendRequests.length > 0 && (
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold">Friend Requests</h2>
              <p className="text-sm text-muted-foreground">
                You have {friendRequests.length} pending friend request{friendRequests.length !== 1 ? 's' : ''}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {friendRequests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={request.sender.profileImage || undefined} />
                        <AvatarFallback>{request.sender.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{request.sender.username}</p>
                        <p className="text-sm text-muted-foreground">{request.sender.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        onClick={() => handleFriendRequest(request.id, 'ACCEPTED')}
                      >
                        Accept
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleFriendRequest(request.id, 'REJECTED')}
                      >
                        Decline
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Friends List Card */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">My Friends</h2>
            <p className="text-sm text-muted-foreground">
              {friends.length} friend{friends.length !== 1 ? 's' : ''}
            </p>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No friends yet. Start by searching for users above!
              </p>
            ) : (
              <div className="space-y-2">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Avatar>
                        <AvatarImage src={friend.profileImage || undefined} />
                        <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{friend.username}</p>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="default"
                        onClick={() => handleMessageClick(friend.id)}
                      >
                        Message
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => handleUnfriend(friend.id)}
                      >
                        Unfriend
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}