"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart } from "lucide-react";

interface Artist {
  name: string;
  id: string;
}

interface Album {
  id: string;
  name: string;
  images: { url: string }[];
  artists: Artist[];
  release_date?: string;
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

interface TrackSearchResult {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
  type: "track";
}

interface AlbumSearchResult {
  id: string;
  name: string;
  artists: { name: string; id: string }[];
  images: { url: string }[];
  release_date: string;
  type: "album";
}

type SearchResult = TrackSearchResult | AlbumSearchResult;

export default function Dashboard() {
  const [recentTracks, setRecentTracks] = useState<RecentTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [trackResults, setTrackResults] = useState<TrackSearchResult[]>([]);
  const [albumResults, setAlbumResults] = useState<AlbumSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [albumLikes, setAlbumLikes] = useState<Record<string, boolean>>({});
  const [trackLikes, setTrackLikes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Fetch recent tracks
        const tracksResponse = await fetch("/api/spotify/recent-tracks");
        const tracksData = await tracksResponse.json();
        setRecentTracks(tracksData.items || []);

        // Check like status for recent tracks
        if (tracksData.items?.length > 0) {
          await checkTracksLikeStatus(tracksData.items.map((item: RecentTrack) => item.track));
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
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
      const response = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json();

      // Separate tracks and albums
      setTrackResults(
        data.tracks?.items.map((item: any) => ({
          ...item,
          type: "track",
        })) || []
      );

      setAlbumResults(
        data.albums?.items.map((item: any) => ({
          ...item,
          type: "album",
        })) || []
      );

      // Check like status for tracks and albums
      if (data.tracks?.items?.length > 0) {
        await checkTracksLikeStatus(data.tracks.items);
      }

      if (data.albums?.items?.length > 0) {
        await checkAlbumsLikeStatus(data.albums.items);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const checkTracksLikeStatus = async (tracks: any[]) => {
    try {
      const likes: Record<string, boolean> = {};

      await Promise.all(
        tracks.map(async (track) => {
          const response = await fetch(`/api/likes/check/${track.id}`);
          if (response.ok) {
            const data = await response.json();
            likes[track.id] = data.isLiked;
          }
        })
      );

      setTrackLikes(likes);
    } catch (error) {
      console.error("Error checking track likes:", error);
    }
  };

  const checkAlbumsLikeStatus = async (albums: any[]) => {
    try {
      const likes: Record<string, boolean> = {};

      await Promise.all(
        albums.map(async (album) => {
          const response = await fetch(`/api/album-likes/check/${album.id}`);
          if (response.ok) {
            const data = await response.json();
            likes[album.id] = data.isLiked;
          }
        })
      );

      setAlbumLikes(likes);
    } catch (error) {
      console.error("Error checking album likes:", error);
    }
  };

  const toggleTrackLike = async (trackId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const isLiked = trackLikes[trackId];
      const url = `/api/likes/${trackId}`;
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(url, { method });

      if (response.ok) {
        setTrackLikes((prev) => ({
          ...prev,
          [trackId]: !isLiked,
        }));
      }
    } catch (error) {
      console.error("Error toggling track like:", error);
    }
  };

  const toggleAlbumLike = async (albumId: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const isLiked = albumLikes[albumId];
      const url = `/api/album-likes/${albumId}`;
      const method = isLiked ? "DELETE" : "POST";

      const response = await fetch(url, { method });

      if (response.ok) {
        setAlbumLikes((prev) => ({
          ...prev,
          [albumId]: !isLiked,
        }));
      }
    } catch (error) {
      console.error("Error toggling album like:", error);
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
            placeholder="Search for songs and albums..."
            className="flex-1 px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Search Results - Tracks */}
      {(trackResults.length > 0 || albumResults.length > 0) && (
        <>
          {trackResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Songs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {trackResults.map((track) => (
                  <div
                    key={track.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors relative"
                  >
                    <Link
                      href={`/track/${track.id}`}
                      className="flex items-center space-x-4"
                    >
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
                          {track.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </p>
                        <p className="text-gray-500 text-sm">
                          {track.album.name}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => toggleTrackLike(track.id, e)}
                      className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-600"
                    >
                      <Heart
                        size={20}
                        className={
                          trackLikes[track.id]
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Search Results - Albums */}
          {albumResults.length > 0 && (
            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Albums</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {albumResults.map((album) => (
                  <div
                    key={album.id}
                    className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors relative"
                  >
                    <Link
                      href={`/album/${album.id}`}
                      className="flex items-center space-x-4"
                    >
                      {album.images[0] && (
                        <Image
                          src={album.images[0].url}
                          alt={album.name}
                          width={60}
                          height={60}
                          className="rounded"
                        />
                      )}
                      <div>
                        <h3 className="font-medium">{album.name}</h3>
                        <p className="text-gray-400 text-sm">
                          {album.artists
                            .map((artist) => artist.name)
                            .join(", ")}
                        </p>
                        {album.release_date && (
                          <p className="text-gray-500 text-sm">
                            {new Date(album.release_date).getFullYear()}
                          </p>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => toggleAlbumLike(album.id, e)}
                      className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-600"
                    >
                      <Heart
                        size={20}
                        className={
                          albumLikes[album.id]
                            ? "fill-red-500 text-red-500"
                            : "text-gray-400"
                        }
                      />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Recently Played Section */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recentTracks.map((item) => (
            <div
              key={`${item.track.id}-${item.played_at}`}
              className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors relative"
            >
              <Link
                href={`/track/${item.track.id}`}
                className="flex items-center space-x-4"
              >
                {item.track.album.images[0] && (
                  <Image
                    src={item.track.album.images[0].url}
                    alt={item.track.name}
                    width={60}
                    height={60}
                    className="rounded"
                  />
                )}
                <div>
                  <h3 className="font-medium">{item.track.name}</h3>
                  <p className="text-gray-400 text-sm">
                    {item.track.artists
                      .map((artist) => artist.name)
                      .join(", ")}
                  </p>
                  <p className="text-gray-500 text-sm">
                    {item.track.album.name}
                  </p>
                </div>
              </Link>
              <button
                onClick={(e) => toggleTrackLike(item.track.id, e)}
                className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-600"
              >
                <Heart
                  size={20}
                  className={
                    trackLikes[item.track.id]
                      ? "fill-red-500 text-red-500"
                      : "text-gray-400"
                  }
                />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
