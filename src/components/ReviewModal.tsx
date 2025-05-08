import React, { useState, useEffect } from "react";
import Rating from "@mui/material/Rating";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import StarIcon from "@mui/icons-material/Star";

interface ReviewModalProps {
  trackId: string;
  onClose: () => void;
}

// Helper functions to convert between UI stars and DB integer values
const starsToDatabaseValue = (stars: number): number => {
  // Convert from UI stars (0.5-5) to database integers (1-10)
  // 0.5 stars -> 1, 1 star -> 2, 1.5 stars -> 3, etc.
  return Math.round(stars * 2);
};

const databaseValueToStars = (dbValue: number): number => {
  // Convert from database integers (1-10) to UI stars (0.5-5)
  return dbValue / 2;
};

const ReviewModal = ({ trackId, onClose }: ReviewModalProps) => {
  const [reviewText, setReviewText] = useState("");
  const [starRating, setStarRating] = useState<number>(2.5); // Default to 2.5 stars (5 in DB)
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [hover, setHover] = useState(-1);

  // Custom labels for the rating values (0.5-5 with half-star precision)
  const labels: { [index: string]: string } = {
    0.5: "0.5 - Terrible",
    1: "1 - Very Poor",
    1.5: "1.5 - Poor",
    2: "2 - Below Average",
    2.5: "2.5 - Average",
    3: "3 - Good",
    3.5: "3.5 - Very Good",
    4: "4 - Excellent",
    4.5: "4.5 - Outstanding", 
    5: "5 - Masterpiece",
  };

  useEffect(() => {
    const fetchExistingReview = async () => {
      try {
        const response = await fetch(`/api/song-reviews/user/${trackId}`);
        if (response.ok) {
          const reviewData = await response.json();
          setReviewText(reviewData.review || "");
          // Convert from database value (1-10) to stars (0.5-5)
          setStarRating(databaseValueToStars(reviewData.rating));
          setIsEditMode(true);
        } else if (response.status === 404) {
          // Handle 404 - user hasn't reviewed this song yet
          setIsEditMode(false);
          setStarRating(2.5); // Default to 2.5 stars
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
    
    // Ensure rating is at least 0.5 stars (1 in DB)
    if (starRating <= 0) {
      setError("Please select a star rating");
      return;
    }
    
    try {
      const method = isEditMode ? "PATCH" : "POST";
      const dbRating = starsToDatabaseValue(starRating);
      
      console.log("method:", method);
      console.log("Star rating:", starRating, "DB value:", dbRating);
      
      const response = await fetch(`/api/song-reviews/${trackId}`, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          review: reviewText || "", 
          rating: dbRating // Send the integer value (1-10) to the backend
        }),
      });

      console.log("response.status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to submit review");
      }

      setSuccess(true);
      setError(null);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit review");
      setSuccess(false);
    }
  };
  
  // Handle UI rating change
  const handleRatingChange = (_event: React.SyntheticEvent, newValue: number | null) => {
    if (newValue !== null) {
      setStarRating(newValue);
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
            placeholder="Write your review (optional)..."
            className="w-full p-2 border rounded mb-4 bg-gray-700 text-white"
          />
          
          <div className="mb-4">
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Typography 
                component="legend" 
                sx={{ 
                  mb: 1, 
                  fontSize: '1rem', 
                  color: '#e5e7eb',
                  fontWeight: 'bold' 
                }}
              >
                Your Rating
              </Typography>
              
              <Rating
                name="track-rating"
                value={starRating}
                precision={0.5}
                max={5}
                onChange={handleRatingChange}
                onChangeActive={(event, newHover) => {
                  setHover(newHover);
                }}
                emptyIcon={<StarIcon style={{ opacity: 0.55, color: 'gray' }} fontSize="inherit" />}
                sx={{ 
                  fontSize: '1.5rem',
                  '& .MuiRating-iconFilled': {
                    color: '#faaf00',
                  },
                  '& .MuiRating-iconHover': {
                    color: '#ffb521',
                  },
                }}
              />
              
              <Typography 
                component="legend" 
                sx={{ 
                  mt: 1, 
                  fontSize: '0.875rem', 
                  color: '#e5e7eb' 
                }}
              >
                {hover !== -1 
                  ? labels[hover] || `${hover} Stars`
                  : labels[starRating] || `${starRating} Stars`}
              </Typography>
            </Box>
          </div>
          
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
