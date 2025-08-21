// Environment variables validation
export function validateEnv() {
  const required = {
    // Client-side (public)
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_CLUB_PHONE: process.env.NEXT_PUBLIC_CLUB_PHONE,
    
    // Server-side only (private)
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  const missing = Object.entries(required)
    .filter(([_, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL format
  const supabaseUrl = required.NEXT_PUBLIC_SUPABASE_URL!;
  if (!supabaseUrl.includes('supabase.co')) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_URL format');
  }

  // Validate keys are not empty
  if (required.NEXT_PUBLIC_SUPABASE_ANON_KEY!.length < 50) {
    throw new Error('Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY format');
  }

  if (required.SUPABASE_SERVICE_ROLE_KEY!.length < 50) {
    throw new Error('Invalid SUPABASE_SERVICE_ROLE_KEY format');
  }

  return {
    supabase: {
      url: required.NEXT_PUBLIC_SUPABASE_URL,
      anonKey: required.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      serviceRoleKey: required.SUPABASE_SERVICE_ROLE_KEY,
    },
    club: {
      phone: required.NEXT_PUBLIC_CLUB_PHONE,
    },
  };
}

// Runtime validation (call this in your app initialization)
export function validateRuntimeEnv() {
  if (typeof window !== 'undefined') {
    // Client-side validation
    const clientRequired = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    };

    const missing = Object.entries(clientRequired)
      .filter(([_, value]) => !value)
      .map(([key]) => key);

    if (missing.length > 0) {
      console.error(`Missing client environment variables: ${missing.join(', ')}`);
      return false;
    }
  }

  return true;
}
