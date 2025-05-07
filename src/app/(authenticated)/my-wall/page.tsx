'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export default function MyWall() {
  const [likedSongs, setLikedSongs] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const response = await fetch('/api/likes');
        if (!response.ok) {
          throw new Error('Failed to fetch liked songs');
        }
        const data = await response.json();
        setLikedSongs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch liked songs');
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">My Wall</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">My Wall</h1>
        <div className="bg-red-900/50 p-4 rounded">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-8">My Wall</h1>
      
      {likedSongs.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400">You haven't liked any songs yet.</p>
          <Link 
            href="/dashboard" 
            className="mt-4 inline-block text-blue-400 hover:text-blue-300"
          >
            Browse songs
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {likedSongs.map((track) => (
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
      )}
    </div>
  );
}