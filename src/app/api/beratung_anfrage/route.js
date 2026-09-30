// src/app/api/anfrage/route.js
import { NextResponse } from "next/server";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.anfrage.api.create_anfrage";

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validate required fields
        const requiredFields = [
            'bei_meiner_anfrage_geht_es_um',
            'das_projekt_soll_verwirklicht_werden',
            'bitte_beschreiben_sie_ihr_vorhaben',
            'vorname',
            'nachname',
            'email',
            'telefon'
        ];
        
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
        
        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(body.email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email format" },
                { status: 400 }
            );
        }
        
        // Validate phone format
        const phoneRegex = /^[0-9+\-()\s]{6,20}$/;
        if (!phoneRegex.test(body.telefon)) {
            return NextResponse.json(
                { success: false, error: "Invalid phone number format" },
                { status: 400 }
            );
        }
        
        // Validate message length
        if (!body.bitte_beschreiben_sie_ihr_vorhaben.trim() || 
            body.bitte_beschreiben_sie_ihr_vorhaben.trim().length < 10) {
            return NextResponse.json(
                { success: false, error: "Description must be at least 10 characters" },
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
                    error: errorData.message || "Failed to submit form",
                    details: errorData 
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({ 
            success: true, 
            message: data.message || "Form submitted successfully",
            data: data 
        });
        
    } catch (error) {
        console.error("Error in multi-step form API:", error);
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