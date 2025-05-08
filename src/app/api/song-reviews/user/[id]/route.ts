import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
): Promise<NextResponse> {
  try {
    // Await context.params
    const { id } = await Promise.resolve(context.params);
    
    // Correctly await the cookies function
    const cookieStore = await cookies();
    const userId = cookieStore.get("user_id")?.value;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("song_ratings")
      .select(
        `
        id,
        review,
        rating,
        created_at,
        user_id,
        song_id,
        user:users (display_name, profile_image_url)
      `
      )
      .eq("song_id", id)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user review:", error);
      return NextResponse.json(
        { error: "Failed to fetch user review" },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(null, { status: 404 }); // No review found
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Error fetching user review:", error);
    return NextResponse.json(
      { error: "Failed to fetch user review" },
      { status: 500 }
    );
  }
}
