'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import UserSearch from '@/components/UserSearch';

interface UserProfile {
  display_name: string;
  images: { url: string }[];
}

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const profileResponse = await fetch('/api/spotify/me');
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          setUserProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navbar */}
      <header className="bg-gray-800 p-4 sticky top-0 z-10 shadow-md">
        <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div className="flex justify-between items-center">
            <Link
              href="/dashboard"
              className="text-2xl font-bold hover:text-green-400 transition-colors"
            >
              Ratify
            </Link>
            <div className="md:hidden flex items-center space-x-4">
              {!loading && userProfile?.images?.[0] && (
                <Image
                  src={userProfile.images[0].url}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="rounded-full"
                />
              )}
            </div>
          </div>

          {/* User Search */}
          <div className="w-full md:max-w-md">
            <UserSearch />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="/my-wall"
              className="text-gray-300 hover:text-white transition-colors"
            >
              My Wall
            </Link>
            <Link
              href="/friend-activity"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Friend Activity
            </Link>
            {!loading && userProfile ? (
              <div className="flex items-center space-x-4">
                <span>{userProfile.display_name}</span>
                {userProfile.images?.[0] && (
                  <Image
                    src={userProfile.images[0].url}
                    alt="Profile"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                )}
              </div>
            ) : (
              <div className="w-40 h-10 flex items-center justify-end">
                {loading && (
                  <div className="w-8 h-8 rounded-full border-2 border-t-transparent border-white animate-spin"></div>
                )}
              </div>
            )}
          </div>

          {/* Mobile Nav Links */}
          <div className="flex md:hidden justify-around pt-2">
            <Link
              href="/my-wall"
              className="text-gray-300 hover:text-white transition-colors"
            >
              My Wall
            </Link>
            <Link
              href="/friend-activity"
              className="text-gray-300 hover:text-white transition-colors"
            >
              Friend Activity
            </Link>
            {!loading && userProfile && (
              <span className="text-gray-300">{userProfile.display_name}</span>
            )}
          </div>
        </div>
      </header>

      {/* Page content */}
      <main>{children}</main>
    </div>
  );
}
