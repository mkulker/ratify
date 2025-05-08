import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } } // Changed to { id: string }
): Promise<NextResponse> {
  try {
    const { id } = context.params; // Changed to context.params.id
    const cookieStore = cookies();
    const userId = (await cookieStore).get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
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
      .eq("song_id", id) // Use id here
      .eq("user_id", userId)
      .single(); // Use single() to get a single review

    if (error) {
      console.error("Error fetching user review:", error);
      return NextResponse.json(
        { error: "Failed to fetch user review" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(null, { status: 404 }); // No review found
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching user review:", error);
    return NextResponse.json(
      { error: "Failed to fetch user review" },
      { status: 500 }
    );
  }
}
