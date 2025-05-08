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

    // Await context.params
    const { id } = await context.params; // Get songId from the dynamic route
    console.log("Song ID:", id);

    // Log the request body
    const { review, rating } = await request.json();
    console.log("Request body:", { review, rating });

    // Await cookies
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

    const { data, error } = await supabase
      .from("song_ratings") // Updated table name
      .insert({
        user_id: userId, // Use userId from cookies
        song_id: id, // Use id from parameters
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
    // Await context.params
    const { id } = await context.params; // Get songId from the dynamic route

    const { data: ratings, error } = await supabase
      .from("song_ratings") // Updated table name
      .select("review, rating, created_at, user_id")
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
