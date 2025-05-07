'use client';

import { useEffect, useState, use } from 'react';
import Image from 'next/image';
import { Heart } from 'lucide-react';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export default function TrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const [track, setTrack] = useState<Track | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await fetch(`/api/spotify/track/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch track');
        }
        const data = await response.json();
        setTrack(data);

        // Save song to our database
        await fetch('/api/songs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            spotify_id: data.id,
            name: data.name,
            artist: data.artists[0].name,
            album_id: data.album.id,
          }),
        });

        // Check if track is liked
        const likeResponse = await fetch(`/api/likes/check/${resolvedParams.id}`);
        if (likeResponse.ok) {
          const { isLiked } = await likeResponse.json();
          setIsLiked(isLiked);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch track');
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [resolvedParams.id]);

  const handleLike = async () => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/likes/${resolvedParams.id}`, {
        method,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isLiked ? 'unlike' : 'like'} track`);
      }

      setIsLiked(!isLiked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update like status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="container mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="container mx-auto">
          <div className="bg-red-900/50 p-4 rounded">
            <p className="text-red-200">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!track) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="container mx-auto">
        <div className="flex items-start space-x-8">
          {track.album.images[0] && (
            <Image
              src={track.album.images[0].url}
              alt={track.name}
              width={300}
              height={300}
              className="rounded-lg shadow-lg"
            />
          )}
          <div className="flex-1">
            <h1 className="text-4xl font-bold mb-2">{track.name}</h1>
            <p className="text-xl text-gray-400 mb-8">
              {track.artists.map((artist) => artist.name).join(', ')}
            </p>
            <p className="text-gray-500 mb-8">{track.album.name}</p>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                isLiked
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Heart className={isLiked ? 'fill-current' : ''} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 