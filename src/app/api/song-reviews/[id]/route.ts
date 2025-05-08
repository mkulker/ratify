import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Log the incoming request
    console.log("Incoming request:", {
      url: request.url,
      method: request.method,
      headers: request.headers,
    });

    // Log the context parameters
    console.log("Context parameters:", context.params);

    // Correctly await context.params
    const { id } = await Promise.resolve(context.params);
    console.log("Song ID:", id);

    // Log the request body
    const { review, rating } = await request.json();
    console.log("Request body:", { review, rating });

    // Correctly handle cookies - await the cookies function
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;
    console.log("User ID from cookies:", userId);

    if (!userId) {
      console.error("User not authenticated");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from("song_ratings")
      .insert({
        user_id: userId,
        song_id: id,
        review,
        rating,
      })
      .select();

    if (error) {
      console.error("Error inserting rating:", error);
      console.error("Supabase error details:", JSON.stringify(error, null, 2));
      return NextResponse.json(
        { error: "Failed to add rating" },
        { status: 500 }
      );
    }

    console.log("Rating added successfully");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding rating:", error);
    return NextResponse.json(
      { error: "Failed to add rating" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Correctly await context.params
    const { id } = await Promise.resolve(context.params);

    const { data: ratings, error } = await supabase
      .from("song_ratings")
      .select(
        `
        review,
        rating,
        created_at,
        user_id,
        user:users (display_name, profile_image_url)
      `
      )
      .eq("song_id", id);

    if (error) {
      console.error("Error fetching ratings:", error);
      return NextResponse.json(
        { error: "Failed to fetch ratings" },
        { status: 500 }
      );
    }

    return NextResponse.json(ratings);
  } catch (error) {
    console.error("Error fetching ratings:", error);
    return NextResponse.json(
      { error: "Failed to fetch ratings" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Correctly await context.params
    const { id } = await Promise.resolve(context.params);
    
    // Correctly handle cookies - await the cookies function
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    console.log("PATCH called");
    console.log("id:", id);
    console.log("userId:", userId);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { review, rating } = await request.json();

    console.log("review:", review);
    console.log("rating:", rating);

    const { data, error } = await supabase
      .from("song_ratings")
      .update({ review, rating })
      .eq("song_id", id)
      .eq("user_id", userId)
      .select();

    if (error) {
      console.error("Error updating rating:", error);
      return NextResponse.json(
        { error: "Failed to update rating" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    console.log("data:", data); // Log the returned data

    return NextResponse.json({ success: true, review: data[0] });
  } catch (error) {
    console.error("Error updating rating:", error);
    return NextResponse.json(
      { error: "Failed to update rating" },
      { status: 500 }
    );
  }
}
