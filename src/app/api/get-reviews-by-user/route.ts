import { NextResponse, NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    // Fetch user info
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("display_name, profile_image_url")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error("Failed to fetch user info:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const [songRatingsRes, albumRatingsRes] = await Promise.all([
      supabase
        .from("song_ratings")
        .select("*, songs(name, artist, album_id)")
        .eq("user_id", userId),
      supabase
        .from("album_ratings")
        .select("*, albums(name, artist, image_url)")
        .eq("user_id", userId),
    ]);

    if (songRatingsRes.error || albumRatingsRes.error) {
      console.error(
        "Fetch errors:",
        songRatingsRes.error,
        albumRatingsRes.error
      );
      return NextResponse.json(
        { error: "Failed to fetch ratings" },
        { status: 500 }
      );
    }

    const combined = [
      ...(songRatingsRes.data || []).map((entry: any) => ({
        type: "song",
        rating: entry.rating,
        review: entry.review,
        created_at: entry.created_at,
        itemId: entry.song_id,
        name: entry.songs?.name,
        artist: entry.songs?.artist,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
      })),
      ...(albumRatingsRes.data || []).map((entry: any) => ({
        type: "album",
        rating: entry.rating,
        review: entry.review,
        created_at: entry.created_at,
        itemId: entry.album_id,
        name: entry.albums?.name,
        artist: entry.albums?.artist,
        imageUrl: entry.albums?.image_url,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
      })),
    ];

    combined.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json(combined);
  } catch (err) {
    console.error("Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
