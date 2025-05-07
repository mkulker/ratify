'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

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

interface SearchResult {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export default function Dashboard() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(`/api/spotify/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data.tracks.items);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for songs..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Search Results</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {searchResults.map((track) => (
              <Link
                href={`/track/${track.id}`}
                key={track.id}
                className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {track.album.images[0] && (
                    <Image
                      src={track.album.images[0].url}
                      alt={track.name}
                      width={60}
                      height={60}
                      className="rounded"
                    />
                  )}
                  <div>
                    <h3 className="font-medium">{track.name}</h3>
                    <p className="text-gray-400 text-sm">
                      {track.artists.map((artist) => artist.name).join(', ')}
                    </p>
                    <p className="text-gray-500 text-sm">{track.album.name}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
    </div>
  );
}