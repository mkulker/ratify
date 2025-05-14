"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import { Edit, Heart, Users } from "lucide-react";
import ReviewModal from "@/components/ReviewModal";
import Rating from '@mui/material/Rating';
import Box from '@mui/material/Box';

interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string }[];
  };
}

interface Review {
  id: string;
  user_id: string;
  song_id: string;
  review: string;
  rating: number;
  created_at: string;
  user?: {
    display_name: string; // Include user display name
    profile_image_url: string;
  };
}

// Helper function to convert integer rating to the correct star display value
const convertRatingToStars = (rating: number): number => {
  // Convert 1-10 scale to 0.5-5 star scale
  return rating / 2;
};

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
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [userReview, setUserReview] = useState<Review | null>(null);
  const [friendReviews, setFriendReviews] = useState<Review[]>([]);

  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const response = await fetch(`/api/spotify/track/${resolvedParams.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch track");
        }
        const data = await response.json();
        setTrack(data);

        // Save song to our database
        await fetch("/api/songs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spotify_id: data.id,
            name: data.name,
            artist: data.artists[0].name,
            album_id: data.album.id,
          }),
        });

        // Check if track is liked
        const likeResponse = await fetch(
          `/api/likes/check/${resolvedParams.id}`
        );
        if (likeResponse.ok) {
          const { isLiked } = await likeResponse.json();
          setIsLiked(isLiked);
        }

        // Fetch user's review
        const reviewResponse = await fetch(
          `/api/song-reviews/user/${resolvedParams.id}`
        );
        if (reviewResponse.ok) {
          const reviewData = await reviewResponse.json();
          setUserReview(reviewData);
        } else if (reviewResponse.status === 404) {
          // No review found, that's okay
          setUserReview(null);
        } else {
          console.error("Failed to fetch user review");
        }

        // Fetch friend's reviews
        const friendsReviewsResponse = await fetch(
          `/api/song-reviews/${resolvedParams.id}`
        );
        if (friendsReviewsResponse.ok) {
          const friendsReviewsData = await friendsReviewsResponse.json();
          setFriendReviews(friendsReviewsData);
        } else {
          console.error("Failed to fetch friend reviews");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch track");
      } finally {
        setLoading(false);
      }
    };

    fetchTrack();
  }, [resolvedParams.id]);

  const handleLike = async () => {
    try {
      const method = isLiked ? "DELETE" : "POST";
      const response = await fetch(`/api/likes/${resolvedParams.id}`, {
        method,
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isLiked ? "unlike" : "like"} track`);
      }

      setIsLiked(!isLiked);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update like status"
      );
    }
  };

  const handleOpenReviewModal = () => {
    setIsReviewModalOpen(true);
  };

  const handleCloseReviewModal = () => {
    setIsReviewModalOpen(false);
    // Refresh user review after closing modal
    fetch(`/api/song-reviews/user/${resolvedParams.id}`)
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else if (response.status === 404) {
          return null;
        } else {
          throw new Error("Failed to fetch user review");
        }
      })
      .then((reviewData) => {
        setUserReview(reviewData);
      })
      .catch((error) => {
        console.error("Error refreshing review:", error);
      });
  };

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-700 rounded w-1/4 mb-8"></div>
          <div className="h-64 bg-gray-800 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-8">
        <div className="bg-red-900/50 p-4 rounded">
          <p className="text-red-200">{error}</p>
        </div>
      </div>
    );
  }

  if (!track) {
    return null;
  }

  return (
    <div className="relative">
      {isReviewModalOpen && (
        <div className="fixed inset-0 backdrop-blur-md z-40"></div>
      )}
      <div className="container mx-auto p-8 relative z-50">
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
              {track.artists.map((artist, index) => (
                <span key={`${track.id}-artist-${index}`}>{artist.name}{index < track.artists.length - 1 ? ", " : ""}</span>
              ))}
            </p>
            <p className="text-gray-500 mb-8">{track.album.name}</p>
            <button
              onClick={handleLike}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                isLiked
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              <Heart key="heart-icon" className={isLiked ? "fill-current" : ""} />
              <span key="like-text">{isLiked ? "Liked" : "Like"}</span>
            </button>
            <button
              onClick={handleOpenReviewModal}
              className="mt-2 flex items-center space-x-2 px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Edit key="edit-icon" />
              <span key="review-text">{userReview ? "Edit Review" : "Review"}</span>
            </button>

            {/* User's review */}
            {userReview && (
              <div key="user-review" className="mt-4 p-4 rounded-lg bg-blue-900/30">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <span key="your-review-text">Your Review:</span>
                </h3>
                <div className="mt-2 p-3 rounded-md bg-gray-800">
                  <p className="text-gray-300">{userReview.review}</p>
                  <Box component="fieldset" borderColor="transparent" sx={{ mt: 1 }}>
                    <Rating 
                      name="user-rating-read-only" 
                      value={convertRatingToStars(userReview.rating)} 
                      precision={0.5}
                      max={5}
                      readOnly 
                      sx={{ 
                        '& .MuiRating-iconFilled': {
                          color: '#faaf00',
                        }
                      }}
                    />
                  </Box>
                </div>
              </div>
            )}

            {/* Friends' Reviews */}
            {friendReviews.length > 0 && (
              <div key="friend-reviews" className="mt-4 p-4 rounded-lg bg-gray-700">
                <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                  <Users key="users-icon" className="text-blue-500" size={20} />
                  <span key="reviews-text">Reviews:</span>
                </h3>
                <div className="mt-2 space-y-4">
                  {friendReviews.map((review, index) => (
                    <div key={review.id ? `review-${review.id}` : `review-index-${index}`} className="p-3 rounded-md bg-gray-800">
                      <p className="text-gray-300">{review.review}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Box component="fieldset" borderColor="transparent">
                          <Rating 
                            name={`friend-rating-${index}`} 
                            value={convertRatingToStars(review.rating)} 
                            precision={0.5}
                            max={5}
                            readOnly 
                            sx={{ 
                              '& .MuiRating-iconFilled': {
                                color: '#faaf00',
                              }
                            }}
                          />
                        </Box>
                        {review.user && (
                          <div className="flex items-center space-x-2">
                            {review.user.profile_image_url && (
                              <Image
                                key={review.id ? `image-${review.id}` : `image-index-${index}`}
                                src={review.user.profile_image_url}
                                alt={review.user.display_name}
                                width={24}
                                height={24}
                                className="rounded-full"
                              />
                            )}
                            <span key={review.id ? `name-${review.id}` : `name-index-${index}`} className="text-sm text-gray-400">
                              {review.user.display_name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Review Modal */}
        {isReviewModalOpen && (
          <ReviewModal
            trackId={resolvedParams.id}
            onClose={handleCloseReviewModal}
          />
        )}
      </div>
    </div>
  );
}
