'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { User, supabase } from '@/lib/supabase';
import { Heart, Disc, Music } from 'lucide-react';

export default function UserWallPage() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [recentLikes, setRecentLikes] = useState<any[]>([]);

  useEffect(() => {
    async function fetchUserData() {
      try {
        setLoading(true);
        
        // Fetch user details
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (userError) {
          throw new Error(userError.message);
        }

        if (!userData) {
          throw new Error('User not found');
        }

        setUser(userData);

        // Fetch user's recently liked tracks using spotify_id instead of user_id
        const { data: likesData, error: likesError } = await supabase
          .from('song_likes')
          .select(`
            *,
            songs (
              spotify_id,
              name,
              artist
            )
          `)
          .eq('spotify_id', userData.spotify_id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (likesError) {
          console.error('Error fetching user likes:', likesError);
        } else {
          setRecentLikes(likesData || []);
        }

      } catch (err: any) {
        console.error('Error loading user profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto mt-10">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-700 h-32 w-32"></div>
            <div className="h-6 bg-gray-700 rounded w-48 mt-4"></div>
            <div className="h-4 bg-gray-700 rounded w-64 mt-2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-4xl mx-auto mt-10 text-center">
          <div className="bg-red-900/30 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-white mb-2">Error</h2>
            <p className="text-red-200">{error || 'Failed to load user profile'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* User Profile Header */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
          {user.profile_image_url ? (
            <Image
              src={user.profile_image_url}
              alt={user.display_name}
              width={128}
              height={128}
              className="rounded-full"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center">
              <Music size={48} className="text-gray-500" />
            </div>
          )}
          
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-bold text-white mb-2">{user.display_name}</h1>
            <p className="text-gray-400 mb-4">@{user.spotify_id}</p>
            
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              <div className="bg-gray-700 rounded-full px-4 py-1 flex items-center gap-2">
                <Heart size={16} className="text-red-400" />
                <span className="text-white">Likes: {recentLikes.length}+</span>
              </div>
              <div className="bg-gray-700 rounded-full px-4 py-1 flex items-center gap-2">
                <Disc size={16} className="text-green-400" />
                <span className="text-white">Joined: {new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-white mb-6">Recent Activity</h2>
          
          {recentLikes.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl text-gray-300 mb-4">Recently Liked Tracks</h3>
              <ul className="space-y-2">
                {recentLikes.map((like) => (
                  <li key={like.id} className="bg-gray-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Heart size={16} className="text-red-400" />
                      <div>
                        <p className="text-white font-medium">{like.songs?.name}</p>
                        <p className="text-gray-400 text-sm">{like.songs?.artist}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400">No recent activity found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}