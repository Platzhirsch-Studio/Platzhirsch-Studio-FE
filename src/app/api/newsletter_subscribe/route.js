// src/app/api/newsletter/route.js
import { NextResponse } from "next/server";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.newsletter_website.api.subscribe_newsletter";

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validate required field
        if (!body.email) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: "Email is required" 
                },
                { status: 400 }
            );
        }
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Forward the data to the external API
        const response = await fetch(API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email: body.email.trim() }),
        });

        const data = await response.json();

        // Handle Frappe/ERPNext specific error responses
        if (data.exc) {
            let errorMessage = "Failed to subscribe";
            if (data._server_messages) {
                try {
                    const parsedMessages = JSON.parse(data._server_messages);
                    if (parsedMessages.length > 0) {
                        const parsedMsg = JSON.parse(parsedMessages[0]);
                        errorMessage = parsedMsg.message;
                    }
                } catch (e) {
                    errorMessage = data._server_messages;
                }
            }
            
            // Check if already subscribed
            if (errorMessage.toLowerCase().includes("bereits angemeldet") || 
                errorMessage.toLowerCase().includes("already subscribed")) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: "Diese E-Mail-Adresse ist bereits für den Newsletter angemeldet.",
                        alreadySubscribed: true
                    },
                    { status: 400 }
                );
            }
            
            return NextResponse.json(
                { 
                    success: false, 
                    error: errorMessage 
                },
                { status: 400 }
            );
        }

        if (!response.ok) {
            return NextResponse.json(
                { 
                    success: false, 
                    error: data.message || "Failed to subscribe to newsletter"
                },
                { status: response.status }
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: data.message || "Successfully subscribed to newsletter",
            data: data 
        });
        
    } catch (error) {
        console.error("Error in newsletter API:", error);
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