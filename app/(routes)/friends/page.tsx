'use client';

import { useState, useEffect } from 'react';
import { Friend, FriendRequest } from '@/types/friend';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchFriends();
    fetchRequests();
  }, []);

  const fetchFriends = async () => {
    // Implement fetch friends logic
  };

  const fetchRequests = async () => {
    // Implement fetch requests logic
  };

  const handleSearch = async () => {
    try {
      const response = await fetch(`/api/users/search?query=${searchQuery}`);
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to search users',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Find Friends</h2>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button onClick={handleSearch}>Search</Button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              {searchResults.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Avatar>
                      <AvatarImage src={user.profileImage} />
                      <AvatarFallback>{user.username[0]}</AvatarFallback>
                    </Avatar>
                    <span>{user.username}</span>
                  </div>
                  <Button variant="outline">Add Friend</Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Friend Requests Card */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Friend Requests</h2>
        </CardHeader>
        <CardContent>
        {requests.map((request) => (
          <div key={request.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={request.profileImage} />
                <AvatarFallback>{request.username[0]}</AvatarFallback>
              </Avatar>
              <span>{request.username}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="default">Accept</Button>
              <Button variant="destructive">Decline</Button>
            </div>
          </div>
        ))}
        </CardContent>
      </Card>

      {/* Friends List Card */}
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">My Friends</h2>
        </CardHeader>
        <CardContent>
        {friends.map((friend) => (
          <div key={friend.id} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              <Avatar>
                <AvatarImage src={friend.profileImage} />
                <AvatarFallback>{friend.username[0]}</AvatarFallback>
              </Avatar>
              <span>{friend.username}</span>
            </div>
            <Button variant="destructive">Remove</Button>
          </div>
        ))}
        </CardContent>
      </Card>
    </div>
  );
}