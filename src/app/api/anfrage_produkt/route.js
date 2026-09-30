// src/app/api/anfrage-produkt/route.js
import { NextResponse } from "next/server";

const API_URL = "https://backoffice.platzhirsch.studio/api/method/platzhirsch_studio.platzhirsch_studio.doctype.anfrage_produkt.api.create_anfrage";

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Validate required fields
        const requiredFields = ['anfrage_vorname', 'anfrage_nachname', 'anfrage_email', 'anfrage_phone', 'anfrage_country', 'anfrage_city', 'anfrage_address', 'anfrage_type'];
        
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
        if (!emailRegex.test(body.anfrage_email)) {
            return NextResponse.json(
                { success: false, error: "Invalid email format" },
                { status: 400 }
            );
        }
        
        // If business type, validate company and fiscal number
        if (body.anfrage_type === 'Geschäft') {
            if (!body.anfrage_company || !body.anfrage_fiscal_number) {
                return NextResponse.json(
                    { 
                        success: false, 
                        error: "Company name and fiscal number are required for business customers" 
                    },
                    { status: 400 }
                );
            }
        }

        // Forward the data to the external API without authentication
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
                    error: "Failed to submit inquiry", 
                    details: errorData 
                },
                { status: response.status }
            );
        }

        const data = await response.json();

        return NextResponse.json({ 
            success: true, 
            message: data.message || "Inquiry submitted successfully",
            data: data 
        });
        
    } catch (error) {
        console.error("Error in product inquiry API:", error);
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