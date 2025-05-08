'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      
      if (code) {
        try {
          const response = await fetch('/api/auth/spotify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
          });

          if (response.ok) {
            const data = await response.json();
            
            // Store the access token in a cookie
            Cookies.set('spotify_access_token', data.access_token, {
              expires: 1, // 1 day
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'strict',
            });

            // Save user data to the database
            try {
              const saveUserResponse = await fetch('/api/auth/save-user', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user: data.user }),
              });

              if (saveUserResponse.ok) {
                const userData = await saveUserResponse.json();
                
                // Store user ID in a cookie for future use
                Cookies.set('user_id', userData.id, {
                  expires: 7, // 7 days
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'strict',
                });
                
                console.log('User saved successfully:', userData);
              } else {
                console.error('Failed to save user data:', await saveUserResponse.json());
              }
            } catch (saveError) {
              console.error('Error saving user data:', saveError);
            }

            router.push('/dashboard');
          } else {
            const errorData = await response.json();
            console.error('Authentication failed:', errorData);
            router.push('/?error=authentication_failed');
          }
        } catch (error) {
          console.error('Authentication error:', error);
          router.push('/?error=authentication_failed');
        }
      } else {
        router.push('/?error=no_code');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-4">Authenticating...</h2>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
      </div>
    </div>
  );
}