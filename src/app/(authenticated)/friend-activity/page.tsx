"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

interface ReviewEntry {
  type: "song" | "album";
  rating: number;
  review?: string;
  created_at: string;
  itemId: string;
  name: string;
  artist: string;
  imageUrl?: string;
  display_name: string;
  profile_image_url: string;
  user_id: string;
}

interface Friend {
  id: string;
  display_name: string;
  profile_image_url: string;
}

export default function FriendActivityPage() {
  const [allReviews, setAllReviews] = useState<ReviewEntry[]>([]);
  const [visibleReviews, setVisibleReviews] = useState<ReviewEntry[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [activeFriendId, setActiveFriendId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriendActivity = async () => {
      try {
        const res = await fetch("/api/get-friends");
        if (!res.ok) throw new Error("Failed to fetch friend list");

        const friendIds: string[] = await res.json();

        const tempFriends: Friend[] = [];
        const all: ReviewEntry[] = [];

        await Promise.all(
          friendIds.map(async (friendId) => {
            const reviewRes = await fetch(
              `/api/get-reviews-by-user?userId=${friendId}`
            );
            if (reviewRes.ok) {
              const reviews: ReviewEntry[] = await reviewRes.json();

              if (reviews.length > 0) {
                const { display_name, profile_image_url } = reviews[0];
                tempFriends.push({
                  id: friendId,
                  display_name,
                  profile_image_url,
                });

                all.push(
                  ...reviews.map((r) => ({
                    ...r,
                    user_id: friendId,
                  }))
                );
              }
            }
          })
        );

        all.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        setFriends(tempFriends);
        setAllReviews(all);
        setVisibleReviews(all); // show all by default
      } catch (err) {
        console.error("Error fetching friend activity:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load friend activity"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchFriendActivity();
  }, []);

  const handleFilter = (friendId: string | null) => {
    setActiveFriendId(friendId);
    if (friendId) {
      setVisibleReviews(allReviews.filter((r) => r.user_id === friendId));
    } else {
      setVisibleReviews(allReviews);
    }
  };

  return (
    <div className="flex">
      {/* Main content */}
      <div className="flex-1 container mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Friend Activity</h1>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-800 rounded"></div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-red-900/50 p-4 rounded">
            <p className="text-red-200">{error}</p>
          </div>
        ) : visibleReviews.length === 0 ? (
          <div className="text-center text-gray-400">
            No recent activity from your friends.
          </div>
        ) : (
          <div className="space-y-6">
            {visibleReviews.map((entry, i) => (
              <Link
                key={i}
                href={`/${entry.type === "song" ? "track" : "album"}/${entry.itemId}`}
                className="flex items-start gap-4 bg-gray-800 hover:bg-gray-700 p-4 rounded-lg transition-colors"
              >
                <div className="flex-shrink-0">
                  <Image
                    src={entry.profile_image_url}
                    alt={entry.display_name}
                    width={48}
                    height={48}
                    className="rounded-full"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-400 mb-1">
                    <span className="text-white font-semibold">
                      {entry.display_name}
                    </span>{" "}
                    rated a {entry.type}
                  </p>
                  <h3 className="font-medium">{entry.name}</h3>
                  <p className="text-gray-400 text-sm">{entry.artist}</p>
                  <p className="text-gray-500 text-sm">
                    ⭐ {entry.rating}/5 •{" "}
                    {new Date(entry.created_at).toLocaleDateString()}
                  </p>
                  {entry.review && (
                    <p className="text-sm text-gray-300 mt-2 italic">
                      “{entry.review}”
                    </p>
                  )}
                </div>
                {entry.imageUrl && (
                  <Image
                    src={entry.imageUrl}
                    alt={entry.name}
                    width={60}
                    height={60}
                    className="rounded"
                  />
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-gray-850 border-l border-gray-700 p-4 sticky top-0 h-screen overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">Friends</h2>
        <button
          onClick={() => handleFilter(null)}
          className={`block w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
            activeFriendId === null
              ? "bg-green-600 text-white"
              : "text-gray-300 hover:bg-gray-700"
          }`}
        >
          All Friends
        </button>
        {friends.map((friend) => (
          <button
            key={friend.id}
            onClick={() => handleFilter(friend.id)}
            className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg mb-2 transition-colors ${
              activeFriendId === friend.id
                ? "bg-green-600 text-white"
                : "text-gray-300 hover:bg-gray-700"
            }`}
          >
            <Image
              src={friend.profile_image_url}
              alt={friend.display_name}
              width={32}
              height={32}
              className="rounded-full"
            />
            <span>{friend.display_name}</span>
          </button>
        ))}
      </aside>
    </div>
  );
}
