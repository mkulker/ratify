'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface UserProfile {
  display_name: string;
  images: { url: string }[];
  followers: { total: number };
}

interface Artist {
  name: string;
  id: string;
}

interface Album {
  images: { url: string }[];
  name: string;
}

interface Track {
  name: string;
  id: string;
  artists: Artist[];
  album: Album;
}

interface RecentTrack {
  track: Track;
  played_at: string;
}

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch user profile
        const profileResponse = await fetch('/api/spotify/me');
        const profileData = await profileResponse.json();
        setUserProfile(profileData);

        // Fetch recent tracks
        const tracksResponse = await fetch('/api/spotify/recent-tracks');
        const tracksData = await tracksResponse.json();
        setRecentTracks(tracksData.items || []);

        setLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Ratify</h1>
          {userProfile && (
            <div className="flex items-center space-x-4">
              <span>{userProfile.display_name}</span>
              {userProfile.images?.[0] && (
                <Image
                  src={userProfile.images[0].url}
                  alt="Profile"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto p-4">
        {/* Recently Played Section */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentTracks.map((track) => (
              <div
                key={track.played_at}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {track.track.album.images[0] && (
                    <Image
                      src={track.track.album.images[0].url}
                      alt={track.track.name}
                      width={60}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{track.track.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {track.track.artists.map((artist) => artist.name).join(', ')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
} 