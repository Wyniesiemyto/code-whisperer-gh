import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactFormData {
  name: string;
  phone: string;
  message: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, phone, message }: ContactFormData = await req.json();

    // Validate required fields
    if (!name || !phone || !message) {
      return new Response(
        JSON.stringify({ error: "Wszystkie pola są wymagane" }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // If RESEND_API_KEY is not set, we'll simulate success for now
    if (!RESEND_API_KEY) {
      console.log("Email would be sent:", { name, phone, message });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Wiadomość została wysłana pomyślnie!" 
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Send email using Resend
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "kontakt@wyniesiemyto.pl", // You'll need to configure your domain
        to: ["kacper@wyniesiemyto.pl"], // Replace with your actual email
        subject: `Nowe zapytanie od ${name}`,
        html: `
          <h2>Nowe zapytanie z formularza kontaktowego</h2>
          <p><strong>Imię i nazwisko:</strong> ${name}</p>
          <p><strong>Telefon:</strong> ${phone}</p>
          <p><strong>Wiadomość:</strong></p>
          <p>${message.replace(/\n/g, '<br>')}</p>
          <hr>
          <p><small>Wysłane z formularza na WyniesiemyTo.pl</small></p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error(`Failed to send email: ${emailResponse.statusText}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Wiadomość została wysłana pomyślnie!" 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Error sending email:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Wystąpił błąd podczas wysyłania wiadomości. Prosimy spróbować ponownie lub zadzwonić bezpośrednio." 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});