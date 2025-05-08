import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { friendId } = await req.json(); // Get the friend's user ID from the request body
    const cookieStore = cookies();
    const userId = cookieStore.get("user_id")?.value; // Get the current user's ID from the cookie

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!friendId) {
      return NextResponse.json(
        { error: "Friend ID is required" },
        { status: 400 }
      );
    }

    // Check if the friendId is a valid UUID
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        friendId
      )
    ) {
      return NextResponse.json({ error: "Invalid Friend ID" }, { status: 400 });
    }

    // Check if the user is trying to add themselves as a friend
    if (userId === friendId) {
      return NextResponse.json(
        { error: "Cannot add yourself as a friend" },
        { status: 400 }
      );
    }

    // Fetch the current user's friends array
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("friends")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const currentFriends: string[] = user.friends || [];

    // Check if the friend is already in the user's friends list
    if (currentFriends.includes(friendId)) {
      return NextResponse.json(
        { message: "Friend already added" },
        { status: 200 }
      );
    }

    // Add the friend to the user's friends array
    const { error: updateError } = await supabase
      .from("users")
      .update({ friends: [...currentFriends, friendId] })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating user:", updateError);
      return NextResponse.json(
        { error: "Failed to add friend" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Friend added successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding friend:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
