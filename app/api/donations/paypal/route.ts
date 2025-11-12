import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPaymentGateway } from "@/lib/payment-gateways";

// POST - Initiate PayPal donation from QR code
// Note: This endpoint is public to allow QR code scanning by congregation members
// Updated: Fixed variable reassignment issue
export async function POST(request: NextRequest) {
  try {
          const body = await request.json();
          let donationAmount: number | null = body.amount ?? null;
          let donationCategory: string | null = body.category ?? null;
          const email = body.email;
          const qrCodeId = body.qrCodeId;
          const reference = body.reference;
          const sessionId = body.sessionId;
          const groupId = body.groupId;

    // Check if user is logged in
    const session = await getServerSession(authOptions);
    let userId = null;
    if (session?.user) {
      userId = (session.user as any).id;
    }

    // Validate groupId if provided
    let validGroupId = null;
    if (groupId) {
      const group = await prisma.smallGroup.findUnique({
        where: { id: groupId },
        select: { id: true, groupGivingEnabled: true },
      });
      if (group && group.groupGivingEnabled) {
        // Verify user is a member of the group if userId is provided
        if (userId) {
          const isMember = await prisma.groupMember.findUnique({
            where: {
              groupId_userId: {
                groupId: groupId,
                userId: userId,
              },
            },
          });
          if (isMember) {
            validGroupId = groupId;
          }
        } else {
          // Allow anonymous group donations if group has giving enabled
          validGroupId = groupId;
        }
      }
    }

           // If QR code ID is provided, verify it exists and link the donation
           let qrCode = null;
           let linkedSessionId = sessionId || null;
           
           if (qrCodeId) {
             qrCode = await prisma.givingQRCode.findUnique({
               where: { id: qrCodeId },
               select: {
                 id: true,
                 amount: true,
                 category: true,
                 expiresAt: true,
                 sessionId: true,
               },
             });

             if (!qrCode) {
               return NextResponse.json(
                 { error: "QR code not found" },
                 { status: 404 }
               );
             }

             // Check if QR code has expired
             if (qrCode.expiresAt && new Date(qrCode.expiresAt) < new Date()) {
               return NextResponse.json(
                 { error: "QR code has expired" },
                 { status: 400 }
               );
             }

             // Use QR code amount if amount not provided
             if ((!donationAmount && donationAmount !== 0) && qrCode.amount) {
               donationAmount = parseFloat(qrCode.amount.toString());
             }

             // Use QR code category if category not provided
             if (!donationCategory && qrCode.category) {
               donationCategory = String(qrCode.category);
             }

             // Get sessionId from QR code if not provided directly
             if (!linkedSessionId && qrCode.sessionId) {
               linkedSessionId = qrCode.sessionId;
             }
           }

    // Validate required fields after potentially getting them from QR code
    if (!donationAmount && donationAmount !== 0 && donationAmount !== null) {
      return NextResponse.json(
        { error: "Amount is required (or null for any amount)" },
        { status: 400 }
      );
    }

    if (!donationCategory) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    // Use validated values
    const amount = donationAmount;
    const category = donationCategory;

    // Get PayPal payment gateway
    const paypalGateway = getPaymentGateway("PAYPAL");
    if (!paypalGateway) {
      return NextResponse.json(
        { error: "PayPal payment gateway not available" },
        { status: 503 }
      );
    }

    const isAvailable = await paypalGateway.isAvailable();
    if (!isAvailable) {
      return NextResponse.json(
        { error: "PayPal is not configured. Please contact the administrator." },
        { status: 503 }
      );
    }

           // Create donation record with pending status
           const donation = await prisma.donation.create({
             data: {
               userId: userId || null,
               amount: amount ? parseFloat(amount.toString()) : 0, // Will be updated after payment
               category: category || "OFFERING",
               paymentMethod: "PAYPAL",
               reference: reference || `PAYPAL-QR-${Date.now()}`,
               status: "pending",
               qrCodeId: qrCodeId || null,
               linkedSessionId, // Link to session if provided
               groupId: validGroupId, // Link to group if provided and valid
               metadata: {
                 email: email || null,
                 qrCodeId,
                 sessionId: linkedSessionId,
                 groupId: validGroupId,
                 isPublicDonation: !userId,
               },
             },
           });

    // Initiate PayPal payment
    const paymentResult = await paypalGateway.processPayment({
      amount: amount ? parseFloat(amount.toString()) : 0,
      currency: "USD",
      description: `Donation - ${category}`,
      reference: donation.reference || `PAYPAL-QR-${donation.id}`,
      userId: userId || undefined,
      metadata: {
        category,
        email,
        qrCodeId,
        donationId: donation.id,
      },
      gatewayOptions: {
        returnUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/give/paypal/return?donationId=${donation.id}`,
        cancelUrl: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/give/paypal/cancel?donationId=${donation.id}`,
      },
    });

    if (!paymentResult.success || !paymentResult.approvalUrl) {
      // Update donation status to failed
      await prisma.donation.update({
        where: { id: donation.id },
        data: { status: "failed" },
      });

      return NextResponse.json(
        { error: paymentResult.error || "Failed to initiate PayPal payment" },
        { status: 500 }
      );
    }

    // Update donation with PayPal order ID
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        paypalOrderId: paymentResult.transactionId,
        status: "processing",
      },
    });

    // Mark QR code as used if provided
    if (qrCodeId && qrCode) {
      await prisma.givingQRCode.update({
        where: { id: qrCodeId },
        data: {
          isUsed: true,
          usedAt: new Date(),
          donationId: donation.id,
        },
      });
    }

    return NextResponse.json({
      success: true,
      approvalUrl: paymentResult.approvalUrl,
      donationId: donation.id,
    });
  } catch (error: any) {
    console.error("Error initiating PayPal donation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate PayPal donation" },
      { status: 500 }
    );
  }
}

