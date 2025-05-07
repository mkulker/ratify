'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/lib/supabase';
import { Search } from 'lucide-react';

export default function UserSearch() {
  const [query, setQuery] = useState<string>('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search for users when query changes
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim() === '') {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);
      
      try {
        const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (response.ok) {
          setResults(data.users || []);
          setIsOpen(data.users.length > 0);
        } else {
          console.error('Error searching users:', data.error);
          setResults([]);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300); // Debounce search requests

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-full max-w-md" ref={searchRef}>
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.trim() !== '' && setIsOpen(true)}
          className="w-full px-4 py-2 pl-10 text-sm bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
      </div>

      {/* Search results dropdown */}
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-400">Loading...</div>
          ) : results.length > 0 ? (
            <ul>
              {results.map((user) => (
                <li key={user.id} className="border-b border-gray-700 last:border-none">
                  <Link
                    href={`/wall/${user.id}`}
                    className="flex items-center p-3 hover:bg-gray-700 transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {user.profile_image_url && (
                      <div className="flex-shrink-0 mr-3">
                        <Image
                          src={user.profile_image_url}
                          alt={user.display_name}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      </div>
                    )}
                    <span className="text-white">{user.display_name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-gray-400">No users found</div>
          )}
        </div>
      )}
    </div>
  );
}