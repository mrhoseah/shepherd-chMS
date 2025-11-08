import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { initiateSTKPush } from "@/lib/mpesa";

// POST - Initiate M-Pesa STK Push
// Note: This endpoint is public to allow QR code scanning by congregation members
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber, amount, qrCodeId, category, userId } = body;
    
    // If userId is provided, verify the user exists (optional - for logged-in users)
    let user = null;
    if (userId) {
      const session = await getServerSession(authOptions);
      if (session && (session.user as any).id === userId) {
        user = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, phone: true },
        });
      }
    }

    if (!phoneNumber || !amount) {
      return NextResponse.json(
        { error: "Phone number and amount are required" },
        { status: 400 }
      );
    }

    // Format phone number (remove + and ensure 254 format)
    let formattedPhone = phoneNumber.replace(/^\+/, "").replace(/^0/, "254");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    const reference = `GIVING-${Date.now()}`;

    // Create donation record with pending status
    const donation = await prisma.donation.create({
      data: {
        userId: user?.id || null, // Link to user if logged in, otherwise anonymous
        amount: parseFloat(amount),
        category: category || "OFFERING",
        paymentMethod: "MPESA",
        reference,
        status: "pending",
        mpesaRequestId: reference,
        metadata: {
          phoneNumber: formattedPhone,
          qrCodeId,
          isPublicDonation: !user, // Mark as public donation if not logged in
        },
      },
    });

    // Initiate M-Pesa STK Push
    const stkResult = await initiateSTKPush({
      phoneNumber: formattedPhone,
      amount: parseFloat(amount),
      accountReference: reference,
      transactionDesc: `Donation - ${category || "OFFERING"}`,
    });

    if (!stkResult.success) {
      // Update donation status to failed
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: "failed",
          metadata: {
            ...(donation.metadata as any),
            error: stkResult.error,
          },
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: stkResult.error || "Failed to initiate STK Push",
          donationId: donation.id,
        },
        { status: 400 }
      );
    }

    // Update donation with M-Pesa request IDs
    await prisma.donation.update({
      where: { id: donation.id },
      data: {
        mpesaRequestId: stkResult.merchantRequestID || reference,
        mpesaCheckoutId: stkResult.checkoutRequestID,
        metadata: {
          ...(donation.metadata as any),
          merchantRequestID: stkResult.merchantRequestID,
          checkoutRequestID: stkResult.checkoutRequestID,
        },
      },
    });

    // If QR code was used, mark it as used
    if (qrCodeId) {
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
      message: stkResult.customerMessage || "STK Push initiated. Please check your phone to complete payment.",
      donationId: donation.id,
      reference,
      checkoutRequestID: stkResult.checkoutRequestID,
      merchantRequestID: stkResult.merchantRequestID,
    });
  } catch (error: any) {
    console.error("Error initiating STK push:", error);
    return NextResponse.json(
      { error: "Failed to initiate STK push" },
      { status: 500 }
    );
  }
}

// POST - M-Pesa callback (webhook)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      Body: {
        stkCallback: {
          MerchantRequestID,
          CheckoutRequestID,
          ResultCode,
          ResultDesc,
          CallbackMetadata,
        },
      },
    } = body;

    // Find donation by M-Pesa request ID
    const donation = await prisma.donation.findFirst({
      where: {
        mpesaRequestId: MerchantRequestID,
      },
    });

    if (!donation) {
      return NextResponse.json({ error: "Donation not found" }, { status: 404 });
    }

    if (ResultCode === 0) {
      // Payment successful
      const amount = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "Amount"
      )?.Value;
      const mpesaReceiptNumber = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "MpesaReceiptNumber"
      )?.Value;
      const transactionDate = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "TransactionDate"
      )?.Value;
      const phoneNumber = CallbackMetadata?.Item?.find(
        (item: any) => item.Name === "PhoneNumber"
      )?.Value;

      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: "completed",
          transactionId: mpesaReceiptNumber,
          mpesaCheckoutId: CheckoutRequestID,
          metadata: {
            ...(donation.metadata as any),
            mpesaReceiptNumber,
            transactionDate,
            phoneNumber,
          },
        },
      });

      // Send automated message using template
      // This will be handled by a separate service/function
    } else {
      // Payment failed
      await prisma.donation.update({
        where: { id: donation.id },
        data: {
          status: "failed",
          metadata: {
            ...(donation.metadata as any),
            error: ResultDesc,
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing M-Pesa callback:", error);
    return NextResponse.json(
      { error: "Failed to process callback" },
      { status: 500 }
    );
  }
}

