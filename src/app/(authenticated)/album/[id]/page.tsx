'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Heart, PlayCircle, Clock, ExternalLink } from 'lucide-react';

interface Artist {
  id: string;
  name: string;
  external_urls: {
    spotify: string;
  };
}

interface Track {
  id: string;
  name: string;
  track_number: number;
  duration_ms: number;
  artists: Artist[];
  external_urls: {
    spotify: string;
  };
}

interface Album {
  id: string;
  name: string;
  release_date: string;
  total_tracks: number;
  images: { url: string; height: number; width: number }[];
  artists: Artist[];
  tracks: {
    items: Track[];
  };
  external_urls: {
    spotify: string;
  };
}

export default function AlbumPage() {
  const { id } = useParams();
  const [album, setAlbum] = useState<Album | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAlbumData = async () => {
      try {
        setLoading(true);
        const accessToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('spotify_access_token='))
          ?.split('=')[1];

        if (!accessToken) {
          throw new Error('No access token found');
        }

        // Fetch album data from Spotify API
        const response = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch album data');
        }

        const data = await response.json();
        setAlbum(data);

        // Check if album is liked
        const likeResponse = await fetch(`/api/album-likes/check/${id}`);
        if (likeResponse.ok) {
          const likeData = await likeResponse.json();
          setIsLiked(likeData.isLiked);
        }
      } catch (err: any) {
        console.error('Error loading album:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAlbumData();
    }
  }, [id]);

  const toggleLike = async () => {
    try {
      const method = isLiked ? 'DELETE' : 'POST';
      const response = await fetch(`/api/album-likes/${id}`, { method });
      
      if (response.ok) {
        setIsLiked(!isLiked);
      } else {
        throw new Error('Failed to update like status');
      }
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error || !album) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-900/30 rounded-lg p-6 text-center">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-gray-300">{error || 'Failed to load album data'}</p>
        </div>
      </div>
    );
  }

  const releaseYear = new Date(album.release_date).getFullYear();

  return (
    <div className="container mx-auto p-4">
      {/* Album Header */}
      <div className="flex flex-col md:flex-row gap-6 mb-8">
        <div className="flex-shrink-0">
          {album.images[0] && (
            <Image
              src={album.images[0].url}
              alt={album.name}
              width={300}
              height={300}
              className="rounded-lg shadow-lg"
              priority
            />
          )}
        </div>
        
        <div className="flex flex-col justify-end">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{album.name}</h1>
          <div className="flex items-center gap-2 mb-4">
            {album.artists.map((artist, idx) => (
              <span key={artist.id} className="text-gray-300">
                {idx > 0 && ", "}
                <a
                  href={artist.external_urls.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-400 transition-colors"
                >
                  {artist.name}
                </a>
              </span>
            ))}
          </div>
          
          <div className="text-gray-400 mb-6">
            <p>{releaseYear} • {album.total_tracks} tracks</p>
          </div>
          
          <div className="flex items-center gap-4">
            <a 
              href={album.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 transition-colors rounded-full"
            >
              <PlayCircle size={20} />
              <span>Play on Spotify</span>
            </a>
            
            <button
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                isLiked 
                  ? 'bg-pink-600 hover:bg-pink-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              <Heart size={20} className={isLiked ? 'fill-white' : ''} />
              <span>{isLiked ? 'Liked' : 'Like'}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Tracklist */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-6">Tracks</h2>
        
        <div className="grid grid-cols-[auto_1fr_auto] gap-y-2 items-center">
          <span className="text-gray-400 font-medium px-2">#</span>
          <span className="text-gray-400 font-medium">Title</span>
          <span className="text-gray-400 font-medium flex items-center gap-1 px-2">
            <Clock size={16} />
          </span>
          
          {album.tracks.items.map((track) => (
            <React.Fragment key={track.id}>
              <span className="text-gray-500 px-4">{track.track_number}</span>
              <Link 
                href={`/track/${track.id}`}
                className="py-3 hover:text-green-400 transition-colors"
              >
                <div className="font-medium">{track.name}</div>
                <div className="text-sm text-gray-400">
                  {track.artists.map((artist, idx) => (
                    <span key={artist.id}>
                      {idx > 0 && ", "}
                      {artist.name}
                    </span>
                  ))}
                </div>
              </Link>
              <span className="text-gray-500 px-4">{formatDuration(track.duration_ms)}</span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}