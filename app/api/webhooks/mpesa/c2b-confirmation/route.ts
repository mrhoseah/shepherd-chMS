import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseAccountNumber } from "@/lib/services/paybill-parser";

/**
 * M-Pesa C2B Confirmation Webhook
 * Receives payment confirmations from Safaricom for Paybill transactions
 * 
 * Payload structure from Safaricom:
 * {
 *   "TransactionType": "Pay Bill",
 *   "TransID": "RKTQDM7W6S",
 *   "TransTime": "20191122063845",
 *   "TransAmount": "10.00",
 *   "BusinessShortCode": "600638",
 *   "BillRefNumber": "JERICHO-TTH",  // ← Our account number
 *   "InvoiceNumber": "",
 *   "OrgAccountBalance": "49197.00",
 *   "ThirdPartyTransID": "",
 *   "MSISDN": "254708374149",
 *   "FirstName": "John",
 *   "MiddleName": "Doe",
 *   "LastName": "Smith"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Extract key fields from M-Pesa webhook
    const {
      TransID,
      TransTime,
      TransAmount,
      BusinessShortCode,
      BillRefNumber, // This is our account number (e.g., "JERICHO-TTH")
      MSISDN, // Phone number
      FirstName,
      MiddleName,
      LastName,
    } = body;

    // Validate required fields
    if (!TransID || !TransAmount || !MSISDN) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if transaction already exists
    const existingDonation = await prisma.donation.findUnique({
      where: { transactionId: TransID },
    });

    if (existingDonation) {
      // Transaction already processed
      return NextResponse.json({
        success: true,
        message: "Transaction already processed",
        donationId: existingDonation.id,
      });
    }

    // Parse account number if provided
    let parsedAccount: Awaited<ReturnType<typeof parseAccountNumber>> | null = null;
    let groupId: string | null = null;
    let fundCategoryId: string | null = null;
    let status = "completed";
    let allocationError: string | null = null;

    if (BillRefNumber && BillRefNumber.trim()) {
      parsedAccount = await parseAccountNumber(BillRefNumber);

      if (parsedAccount.isValid) {
        groupId = parsedAccount.groupId;
        fundCategoryId = parsedAccount.fundCategoryId;
      } else {
        // Invalid account number - flag as unallocated
        status = "unallocated";
        allocationError = parsedAccount.error || "Failed to parse account number";
      }
    } else {
      // No account number provided - flag as unallocated
      status = "unallocated";
      allocationError = "No account number provided";
    }

    // Format phone number
    let formattedPhone = MSISDN.replace(/^\+/, "").replace(/^0/, "254");
    if (!formattedPhone.startsWith("254")) {
      formattedPhone = "254" + formattedPhone;
    }

    // Try to find user by phone number
    const user = await prisma.user.findFirst({
      where: { phone: formattedPhone },
      select: { id: true },
    });

    // Parse transaction time
    // Format: YYYYMMDDHHmmss (e.g., "20191122063845")
    let transactionDate = new Date();
    if (TransTime && TransTime.length === 14) {
      const year = parseInt(TransTime.substring(0, 4));
      const month = parseInt(TransTime.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(TransTime.substring(6, 8));
      const hour = parseInt(TransTime.substring(8, 10));
      const minute = parseInt(TransTime.substring(10, 12));
      const second = parseInt(TransTime.substring(12, 14));
      transactionDate = new Date(year, month, day, hour, minute, second);
    }

    // Create donation record
    const donation = await prisma.donation.create({
      data: {
        userId: user?.id || null,
        amount: parseFloat(TransAmount),
        category: fundCategoryId
          ? undefined // Will be set via fundCategory relation
          : "OFFERING", // Default category if unallocated
        paymentMethod: "MPESA",
        transactionId: TransID,
        reference: `PAYBILL-${TransID}`,
        status: status,
        paybillAccountRef: BillRefNumber || null,
        groupId: groupId,
        fundCategoryId: fundCategoryId,
        metadata: {
          transTime: TransTime,
          businessShortCode: BusinessShortCode,
          firstName: FirstName,
          middleName: MiddleName,
          lastName: LastName,
          phone: formattedPhone,
          parsedAccount: parsedAccount,
          allocationError: allocationError,
        },
        createdAt: transactionDate,
      },
    });

    // Trigger workflows if donation is allocated
    if (status === "completed" && donation.userId) {
      Promise.resolve().then(async () => {
        try {
          const { executeWorkflows } = await import("@/lib/workflow-engine");
          await executeWorkflows({
            type: "DONATION_RECEIVED",
            userId: donation.userId || undefined,
            memberId: donation.userId || undefined,
            donationId: donation.id,
            data: {
              donation,
              amount: parseFloat(TransAmount),
              category: fundCategoryId ? "PAYBILL" : "OFFERING",
            },
          });
        } catch (error) {
          console.error("Failed to execute workflows:", error);
        }
      });
    }

    return NextResponse.json({
      success: true,
      donationId: donation.id,
      status: donation.status,
      allocated: status === "completed",
      message:
        status === "completed"
          ? "Donation successfully allocated"
          : "Donation received but requires manual allocation",
    });
  } catch (error: any) {
    console.error("Error processing M-Pesa C2B confirmation:", error);
    return NextResponse.json(
      { error: "Failed to process confirmation", details: error.message },
      { status: 500 }
    );
  }
}

