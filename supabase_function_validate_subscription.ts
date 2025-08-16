// Supabase Edge Function: validate-subscription
// Place this in your Supabase project at: supabase/functions/validate-subscription/index.ts

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

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // TODO: Implement your actual subscription validation logic here
    // This is a basic example - replace with your actual business logic
    
    // Option 1: Check against a subscriptions table
    const { data: subscription, error } = await supabase
      .from('subscriptions') // Adjust table name as needed
      .select('*')
      .eq('email', userEmail)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Database error occurred' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Determine if subscription is valid
    let isValid = false
    let plan = 'free'
    let userId = 'unknown'

    if (subscription) {
      isValid = true
      plan = subscription.plan || 'pro'
      userId = subscription.user_id || subscription.id
    } else {
      // Option 2: For testing, you can have some hardcoded valid emails
      const testValidEmails = [
        'test@example.com',
        'admin@yourcompany.com',
        // Add your test emails here
      ]
      
      if (testValidEmails.includes(userEmail.toLowerCase())) {
        isValid = true
        plan = 'pro'
        userId = 'test-user-123'
      }
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

/* 
DEPLOYMENT INSTRUCTIONS:

1. Create the function directory:
   mkdir -p supabase/functions/validate-subscription

2. Save this file as:
   supabase/functions/validate-subscription/index.ts

3. Deploy the function:
   supabase functions deploy validate-subscription

4. Test the function:
   curl -X POST 'https://your-project.supabase.co/functions/v1/validate-subscription' \
     -H 'Authorization: Bearer YOUR_ANON_KEY' \
     -H 'apikey: YOUR_ANON_KEY' \
     -H 'Content-Type: application/json' \
     -d '{"userEmail":"test@example.com"}'

CUSTOMIZATION OPTIONS:

1. Database Table Approach:
   - Create a 'subscriptions' table with columns: email, status, plan, user_id
   - Update the query above to match your schema

2. External API Approach:
   - Replace the database query with a call to your payment processor
   - Examples: Stripe, PayPal, etc.

3. Hardcoded Testing:
   - Add test emails to the testValidEmails array
   - Useful for development and demo purposes

4. Advanced Validation:
   - Add expiration date checks
   - Check payment status
   - Validate subscription tiers
*/