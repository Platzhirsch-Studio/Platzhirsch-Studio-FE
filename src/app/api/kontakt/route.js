// src/app/api/kontakt/route.js
import { NextResponse } from "next/server";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.kontakt_form.api.create_contact";

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validate required fields
        const requiredFields = ['name', 'email_address', 'ihre_nachricht'];
        
        for (const field of requiredFields) {
            if (!body[field]) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: `Missing required field: ${field}` 
                    },
                    { status: 400 }
                );
            }
        }
        
        // Validate name (at least 2 characters)
        if (!body.name.trim() || body.name.trim().length < 2) {
            return NextResponse.json(
                { success: false, error: "Name must be at least 2 characters" },
                { status: 400 }
            );
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email_address)) {
            return NextResponse.json(
                { success: false, error: "Invalid email format" },
                { status: 400 }
            );
        }
        
        // Validate phone if provided
        if (body.telefon && body.telefon.trim()) {
            const phoneRegex = /^[0-9+\-()\s]{6,20}$/;
            if (!phoneRegex.test(body.telefon)) {
                return NextResponse.json(
                    { success: false, error: "Invalid phone number format" },
                    { status: 400 }
                );
            }
        }
        
        // Validate message (at least 10 characters)
        if (!body.ihre_nachricht.trim() || body.ihre_nachricht.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: "Message must be at least 10 characters" },
                { status: 400 }
            );
        }

        // Forward the data to the external API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            let errorData = {};
            try {
                errorData = await response.json();
                console.error("Error response:", errorData);
            } catch (e) {
                const errorText = await response.text();
                console.error("Error text:", errorText);
                errorData = { message: errorText };
            }
            
            return NextResponse.json(
                { 
                    success: false, 
                    error: errorData.message || "Failed to submit contact form",
                    details: errorData 
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({ 
            success: true, 
            message: data.message || "Contact form submitted successfully",
            data: data 
        });
        
    } catch (error) {
        console.error("Error in contact form API:", error);
        return NextResponse.json(
            { 
                success: false, 
                error: "Internal Server Error",
                message: error.message 
            },
            { status: 500 }
        );
    }
}