import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('label_image') as File;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // --- ENTERPRISE AI SIMULATION ---
    // In production, this buffer is sent to Google Cloud Vision API or AWS Textract
    // using the 'DOCUMENT_TEXT_DETECTION' feature which supports Myanmar Unicode.
    
    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate Image Quality Check (Randomly fail 10% of the time to demonstrate the gatekeeper)
    const isBlurry = Math.random() < 0.1;
    if (isBlurry) {
      return NextResponse.json({ 
        success: false, 
        error_code: "IMAGE_REJECTED",
        message: "Image is too blurry or dark. Please retake the photo with good lighting." 
      }, { status: 422 });
    }

    // Simulate successful OCR Extraction
    return NextResponse.json({
      success: true,
      extracted_data: {
        sender_name: "Aung Kaung Store",
        sender_phone: "09123456789",
        recipient_name: "Daw Mya Mya",
        recipient_phone: "09987654321",
        recipient_address: "No 12, Hlaing Township, Yangon",
        service_type: "standard",
        cod_amount_mmks: 45000,
        delivery_fee_mmks: 2500
      }
    });

  } catch (error) {
    return NextResponse.json({ error: "Server processing failed" }, { status: 500 });
  }
}
