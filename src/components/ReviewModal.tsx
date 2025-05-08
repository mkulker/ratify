import React, { useState, useEffect } from "react";

interface ReviewModalProps {
  trackId: string;
  onClose: () => void;
}

const ReviewModal = ({ trackId, onClose }: ReviewModalProps) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const fetchExistingReview = async () => {
      try {
        const response = await fetch(`/api/song-reviews/user/${trackId}`);
        if (response.ok) {
          const reviewData = await response.json();
          setReviewText(reviewData.review);
          setRating(reviewData.rating);
          setIsEditMode(true);
        } else if (response.status === 404) {
          setIsEditMode(false);
        } else {
          console.error("Failed to fetch existing review");
          setError("Failed to fetch existing review");
        }
      } catch (error) {
        console.error("Error fetching existing review:", error);
        setError("Error fetching existing review");
      }
    };

    fetchExistingReview();
  }, [trackId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("handleSubmit called");
    console.log("isEditMode:", isEditMode);
    console.log("reviewText:", reviewText);
    console.log("rating:", rating);
    try {
      const method = isEditMode ? "PATCH" : "POST";
      console.log("method:", method);
      const response = await fetch(`/api/song-reviews/${trackId}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review: reviewText, rating }),
      });

      console.log("response.status:", response.status); // Log the status code

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setSuccess(true);
      setError(null); // Clear any previous errors
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
      setSuccess(false); // Clear success message if there's an error
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="fixed inset-0 backdrop-blur-md bg-black bg-opacity-50"
        onClick={onClose}
      ></div>
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-96 relative z-10">
        <h2 className="text-2xl font-bold mb-4">
          {isEditMode ? "Edit Review" : "Leave a Review"}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">Review submitted!</p>}
        <form onSubmit={handleSubmit}>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review..."
            className="w-full p-2 border rounded mb-4 bg-gray-700 text-white"
            required
          />
          <select
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            className="w-full p-2 border rounded mb-4 bg-gray-700 text-white"
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <option key={star} value={star}>
                {star} Star{star > 1 && "s"}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-500 hover:bg-blue-600 text-white"
            >
              Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;
