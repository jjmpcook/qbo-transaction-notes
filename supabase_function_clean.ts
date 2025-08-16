import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface SubscriptionRequest {
  userEmail: string
}

interface SubscriptionResponse {
  valid: boolean
  plan: string
  userId: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Parse request body
    const { userEmail }: SubscriptionRequest = await req.json()

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'userEmail is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log(`Validating subscription for: ${userEmail}`)

    // For testing, use hardcoded valid emails (you can add database logic later)
    const testValidEmails = [
      'test@example.com',
      'admin@yourcompany.com',
      'your-email@example.com'
    ]

    let isValid = false
    let plan = 'free'
    let userId = 'unknown'

    if (testValidEmails.includes(userEmail.toLowerCase())) {
      isValid = true
      plan = 'pro'
      userId = 'test-user-123'
    }

    const response: SubscriptionResponse = {
      valid: isValid,
      plan: plan,
      userId: userId
    }

    console.log(`Validation result for ${userEmail}:`, response)

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})