import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('image');

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No image file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Uploading image to iimg.live:', file.name);

    // Create FormData for iimg.live
    const uploadFormData = new FormData();
    uploadFormData.append('image', file);

    // Upload to iimg.live
    const uploadResponse = await fetch('https://iimg.live/api/upload', {
      method: 'POST',
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('iimg.live upload failed:', errorText);
      throw new Error(`Upload failed: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }

    const result = await uploadResponse.json();
    
    console.log('Upload successful:', result);

    // iimg.live returns the URL in result.data.url or result.url
    const imageUrl = result.data?.url || result.url;

    if (!imageUrl) {
      console.error('No URL in response:', result);
      throw new Error('No image URL returned from upload service');
    }

    return new Response(
      JSON.stringify({ url: imageUrl }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in upload-image function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload image';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
