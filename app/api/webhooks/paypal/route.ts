import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST - PayPal webhook handler
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type;
    const resource = body.resource;

    // Verify webhook signature (implement in production)
    // const isValid = verifyPayPalWebhook(request);
    // if (!isValid) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      // Payment was completed
      const transactionId = resource.id;
      const amount = parseFloat(resource.amount.value);
      const currency = resource.amount.currency_code;
      const payerEmail = resource.payer?.email_address;
      const customId = resource.custom_id; // Should contain donation reference

      // Find or create donation
      let donation = await prisma.donation.findUnique({
        where: { paypalTransactionId: transactionId },
      });

      if (!donation && customId) {
        // Try to find by custom reference
        donation = await prisma.donation.findFirst({
          where: { reference: customId },
        });
      }

      if (donation) {
        // Update existing donation
        await prisma.donation.update({
          where: { id: donation.id },
          data: {
            status: "completed",
            paypalTransactionId: transactionId,
            paypalOrderId: resource.supplementary_data?.related_ids?.order_id,
            metadata: {
              ...(donation.metadata as any),
              payerEmail,
              currency,
              completedAt: new Date().toISOString(),
            },
          },
        });

        // Send automated message using template
        await sendAutomatedMessage(donation.id, "PAYPAL_RECEIPT");
      } else {
        // Create new donation (anonymous PayPal payment)
        donation = await prisma.donation.create({
          data: {
            amount,
            category: "OFFERING",
            paymentMethod: "PAYPAL",
            status: "completed",
            paypalTransactionId: transactionId,
            paypalOrderId: resource.supplementary_data?.related_ids?.order_id,
            reference: customId || `PAYPAL-${transactionId}`,
            metadata: {
              payerEmail,
              currency,
              completedAt: new Date().toISOString(),
            },
          },
        });

        // Send automated message
        await sendAutomatedMessage(donation.id, "PAYPAL_RECEIPT");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error processing PayPal webhook:", error);
    return NextResponse.json(
      { error: "Failed to process webhook" },
      { status: 500 }
    );
  }
}

// Helper function to send automated messages
async function sendAutomatedMessage(
  donationId: string,
  category: string
) {
  try {
    // Get default template for category
    const template = await prisma.messageTemplate.findFirst({
      where: {
        category,
        isDefault: true,
        isActive: true,
      },
    });

    if (!template) {
      console.log(`No template found for category: ${category}`);
      return;
    }

    // Get donation details
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      include: { user: true },
    });

    if (!donation) return;

    // Replace template variables
    let message = template.content;
    let subject = template.subject || "";

    const variables: any = {
      amount: donation.amount.toString(),
      category: donation.category,
      transactionId: donation.transactionId || donation.paypalTransactionId || donation.reference,
      date: new Date().toLocaleDateString(),
      donorName: donation.user
        ? `${donation.user.firstName} ${donation.user.lastName}`
        : "Anonymous",
    };

    // Replace variables in message
    Object.keys(variables).forEach((key) => {
      const regex = new RegExp(`{{${key}}}`, "g");
      message = message.replace(regex, variables[key]);
      subject = subject.replace(regex, variables[key]);
    });

    // Send message based on template type
    if (template.type === "EMAIL" && donation.user?.email) {
      // Send email (implement email service)
      console.log("Sending email:", { to: donation.user.email, subject, message });
    } else if (template.type === "SMS" && donation.user?.phone) {
      // Send SMS
      console.log("Sending SMS:", { to: donation.user.phone, message });
      // Implement Afrika's Talking SMS API call
    }

    // Mark receipt as sent
    await prisma.donation.update({
      where: { id: donationId },
      data: {
        receiptSent: true,
        receiptSentAt: new Date(),
      },
    });
  } catch (error) {
    console.error("Error sending automated message:", error);
  }
}

