"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LikedSong {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

export default function WallPage() {
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchLikedSongs = async () => {
      try {
        const response = await fetch("/api/likes");
        if (!response.ok) throw new Error("Failed to fetch liked songs");
        const data = await response.json();
        setLikedSongs(data);
      } catch (error) {
        console.error("Error fetching liked songs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikedSongs();
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
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">My Wall</h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700"
          >
            ← Back
          </button>
        </div>

        {likedSongs.length === 0 ? (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No liked songs yet</h2>
            <p className="text-gray-400 mb-8">
              Start liking songs to build your wall!
            </p>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {likedSongs.map((song) => (
              <Link
                key={song.id}
                href={`/track/${song.id}`}
                className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 transition-colors"
              >
                <div className="relative aspect-square">
                  {song.album.images[0] && (
                    <Image
                      src={song.album.images[0].url}
                      alt={song.name}
                      fill
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1 truncate">
                    {song.name}
                  </h3>
                  <p className="text-gray-400 text-sm truncate">
                    {song.artists.map((artist) => artist.name).join(", ")}
                  </p>
                  <p className="text-gray-500 text-sm truncate">
                    {song.album.name}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
