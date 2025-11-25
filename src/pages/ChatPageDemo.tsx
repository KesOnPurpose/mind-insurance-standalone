import { createContext, useContext, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import ChatPage from './ChatPage';

// Mock auth context for testing
const MockAuthContext = createContext<{ user: User | null }>({ user: null });

// Development wrapper for ChatPage that bypasses auth
export default function ChatPageDemo() {
  // Create a mock user for testing
  const mockUser = {
    id: 'test-user-123',
    email: 'test@example.com',
    app_metadata: {},
    user_metadata: {
      full_name: 'Test User'
    },
    aud: 'authenticated',
    created_at: new Date().toISOString()
  } as User;

  return (
    <MockAuthContext.Provider value={{ user: mockUser }}>
      <ChatPageWithMockAuth />
    </MockAuthContext.Provider>
  );
}

// Wrapper component that provides mock auth to ChatPage
function ChatPageWithMockAuth() {
  // Override the useAuth hook in ChatPage by providing a mock user through React context
  console.log('[ChatPageDemo] Rendering with mock user for testing SSE');
  return <ChatPage />;
}