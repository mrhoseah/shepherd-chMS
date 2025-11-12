import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { generatePDFReportBase64 } from "@/lib/reports/jsreport";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { template, data, format = "pdf" } = body;

    if (!template) {
      return NextResponse.json(
        { error: "Template name is required" },
        { status: 400 }
      );
    }

    // Generate report based on template type
    let reportData: any = {};
    let templateContent: string | undefined;

    switch (template) {
      case "donation-receipt":
        reportData = await prepareDonationReceiptData(data);
        templateContent = getDonationReceiptTemplate();
        break;

      case "giving-statement":
        reportData = await prepareGivingStatementData(data);
        templateContent = getGivingStatementTemplate();
        break;

      case "payslip":
        reportData = await preparePayslipData(data);
        templateContent = getPayslipTemplate();
        break;

      default:
        return NextResponse.json(
          { error: `Unknown template: ${template}` },
          { status: 400 }
        );
    }

    // Generate PDF
    const pdfBase64 = await generatePDFReportBase64(template, reportData, {
      templateContent,
      templateEngine: "handlebars",
    });

    return NextResponse.json({
      success: true,
      format,
      data: pdfBase64,
      filename: `${template}-${new Date().toISOString().split("T")[0]}.pdf`,
    });
  } catch (error: any) {
    console.error("Error generating report:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate report" },
      { status: 500 }
    );
  }
}

// Prepare data for donation receipt
async function prepareDonationReceiptData(data: any) {
  const { donationId } = data;

  const donation = await prisma.donation.findUnique({
    where: { id: donationId },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          address: true,
        },
      },
    },
  });

  if (!donation) {
    throw new Error("Donation not found");
  }

  // Get church info
  const church = await prisma.church.findFirst({
    select: {
      name: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      phone: true,
      email: true,
    },
  });

  return {
    receipt: {
      number: donation.transactionId || donation.id,
      date: donation.createdAt,
    },
    church: church || {
      name: "Church Name",
      address: "Church Address",
    },
    donor: donation.user
      ? {
          name: `${donation.user.firstName} ${donation.user.lastName}`,
          email: donation.user.email,
          address: donation.user.address,
        }
      : {
          name: "Anonymous",
        },
    donation: {
      amount: Number(donation.amount),
      category: donation.category,
      method: donation.paymentMethod,
      date: donation.createdAt,
      reference: donation.reference || donation.transactionId,
    },
    isTaxDeductible: true,
  };
}

// Prepare data for giving statement
async function prepareGivingStatementData(data: any) {
  const { memberId, year } = data;

  const user = await prisma.user.findUnique({
    where: { id: memberId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      address: true,
      phone: true,
    },
  });

  if (!user) {
    throw new Error("Member not found");
  }

  const startDate = new Date(`${year}-01-01`);
  const endDate = new Date(`${year}-12-31`);

  const donations = await prisma.donation.findMany({
    where: {
      userId: memberId,
      createdAt: {
        gte: startDate,
        lte: endDate,
      },
      status: "completed",
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const total = donations.reduce(
    (sum, d) => sum + Number(d.amount),
    0
  );

  // Get church info
  const church = await prisma.church.findFirst({
    select: {
      name: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
      phone: true,
      email: true,
    },
  });

  return {
    church: church || {
      name: "Church Name",
      address: "Church Address",
    },
    member: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
      address: user.address,
    },
    year,
    donations: donations.map((d) => ({
      date: d.createdAt,
      category: d.category,
      amount: Number(d.amount),
      method: d.paymentMethod,
    })),
    summary: {
      total,
      count: donations.length,
      taxDeductible: total, // Assuming all donations are tax-deductible
    },
  };
}

// Prepare data for payslip
async function preparePayslipData(data: any) {
  const { payslipId } = data;

  const payslip = await prisma.payslip.findUnique({
    where: { id: payslipId },
    include: {
      staff: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      payroll: {
        select: {
          payPeriod: true,
          startDate: true,
          endDate: true,
        },
      },
    },
  });

  if (!payslip) {
    throw new Error("Payslip not found");
  }

  // Get church info
  const church = await prisma.church.findFirst({
    select: {
      name: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      country: true,
    },
  });

  return {
    church: church || {
      name: "Church Name",
      address: "Church Address",
    },
    employee: {
      name: `${payslip.staff.user.firstName} ${payslip.staff.user.lastName}`,
      email: payslip.staff.user.email,
      employeeId: payslip.staff.id,
    },
    payPeriod: {
      period: payslip.payroll.payPeriod,
      startDate: payslip.payroll.startDate,
      endDate: payslip.payroll.endDate,
      payDate: payslip.payDate,
    },
    earnings: {
      baseSalary: Number(payslip.baseSalary),
      allowances: Number(payslip.allowances),
      bonuses: Number(payslip.bonuses),
      total: Number(payslip.baseSalary) + Number(payslip.allowances) + Number(payslip.bonuses),
    },
    deductions: {
      total: Number(payslip.deductions),
      breakdown: payslip.breakdown as any,
    },
    netPay: Number(payslip.netPay),
    breakdown: payslip.breakdown as any,
  };
}

// Template functions
function getDonationReceiptTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .receipt-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h3 {
      color: #2563eb;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    table th, table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    table th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    .total {
      text-align: right;
      font-size: 18px;
      font-weight: bold;
      margin-top: 20px;
      padding-top: 10px;
      border-top: 2px solid #2563eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{church.name}}</h1>
    <p>{{church.address}}</p>
    <p>{{church.city}}, {{church.state}} {{church.zipCode}}</p>
  </div>

  <div class="receipt-info">
    <div>
      <h2>DONATION RECEIPT</h2>
      <p><strong>Receipt #:</strong> {{receipt.number}}</p>
      <p><strong>Date:</strong> {{formatDate receipt.date}}</p>
    </div>
  </div>

  <div class="section">
    <h3>Donor Information</h3>
    <p><strong>Name:</strong> {{donor.name}}</p>
    {{#if donor.email}}<p><strong>Email:</strong> {{donor.email}}</p>{{/if}}
    {{#if donor.address}}<p><strong>Address:</strong> {{donor.address}}</p>{{/if}}
  </div>

  <div class="section">
    <h3>Donation Details</h3>
    <table>
      <tr>
        <th>Amount</th>
        <th>Category</th>
        <th>Payment Method</th>
        <th>Date</th>
      </tr>
      <tr>
        <td>${{formatCurrency donation.amount}}</td>
        <td>{{donation.category}}</td>
        <td>{{donation.method}}</td>
        <td>{{formatDate donation.date}}</td>
      </tr>
    </table>
  </div>

  <div class="total">
    <p>Total Donation: ${{formatCurrency donation.amount}}</p>
    {{#if isTaxDeductible}}
    <p style="color: #059669;">This donation is tax-deductible</p>
    {{/if}}
  </div>

  <div class="footer">
    <p>Thank you for your generous donation!</p>
    <p>{{church.name}} | {{church.phone}} | {{church.email}}</p>
  </div>
</body>
</html>
  `;
}

function getGivingStatementTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .member-info {
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h3 {
      color: #2563eb;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    table th, table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    table th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    .summary {
      margin-top: 30px;
      padding: 20px;
      background-color: #f9fafb;
      border: 2px solid #2563eb;
    }
    .summary h3 {
      margin-top: 0;
      color: #2563eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{church.name}}</h1>
    <p>{{church.address}}</p>
    <p>{{church.city}}, {{church.state}} {{church.zipCode}}</p>
  </div>

  <div class="member-info">
    <h2>GIVING STATEMENT - {{year}}</h2>
    <p><strong>{{member.name}}</strong></p>
    {{#if member.address}}<p>{{member.address}}</p>{{/if}}
    {{#if member.email}}<p>{{member.email}}</p>{{/if}}
  </div>

  <div class="section">
    <h3>Donations for {{year}}</h3>
    <table>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Payment Method</th>
        <th>Amount</th>
      </tr>
      {{#each donations}}
      <tr>
        <td>{{formatDate date}}</td>
        <td>{{category}}</td>
        <td>{{method}}</td>
        <td>${{formatCurrency amount}}</td>
      </tr>
      {{/each}}
    </table>
  </div>

  <div class="summary">
    <h3>Summary</h3>
    <p><strong>Total Donations:</strong> ${{formatCurrency summary.total}}</p>
    <p><strong>Number of Donations:</strong> {{summary.count}}</p>
    <p><strong>Tax Deductible Amount:</strong> ${{formatCurrency summary.taxDeductible}}</p>
  </div>

  <div class="footer">
    <p>This statement is provided for your records and tax purposes.</p>
    <p>{{church.name}} | {{church.phone}} | {{church.email}}</p>
  </div>
</body>
</html>
  `;
}

function getPayslipTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #2563eb;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #2563eb;
      margin: 0;
    }
    .employee-info {
      margin-bottom: 30px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section h3 {
      color: #2563eb;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    table th, table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    table th {
      background-color: #f3f4f6;
      font-weight: bold;
    }
    .net-pay {
      margin-top: 30px;
      padding: 20px;
      background-color: #f0fdf4;
      border: 2px solid #059669;
      text-align: center;
    }
    .net-pay h2 {
      color: #059669;
      margin: 0;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>{{church.name}}</h1>
    <p>{{church.address}}</p>
    <p>{{church.city}}, {{church.state}} {{church.zipCode}}</p>
  </div>

  <div class="employee-info">
    <h2>PAYSLIP</h2>
    <p><strong>Employee:</strong> {{employee.name}}</p>
    <p><strong>Employee ID:</strong> {{employee.employeeId}}</p>
    <p><strong>Pay Period:</strong> {{payPeriod.period}}</p>
    <p><strong>Pay Date:</strong> {{formatDate payPeriod.payDate}}</p>
  </div>

  <div class="section">
    <h3>Earnings</h3>
    <table>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
      <tr>
        <td>Base Salary</td>
        <td>${{formatCurrency earnings.baseSalary}}</td>
      </tr>
      <tr>
        <td>Allowances</td>
        <td>${{formatCurrency earnings.allowances}}</td>
      </tr>
      <tr>
        <td>Bonuses</td>
        <td>${{formatCurrency earnings.bonuses}}</td>
      </tr>
      <tr style="font-weight: bold;">
        <td>Total Earnings</td>
        <td>${{formatCurrency earnings.total}}</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h3>Deductions</h3>
    <table>
      <tr>
        <th>Description</th>
        <th>Amount</th>
      </tr>
      <tr>
        <td>Total Deductions</td>
        <td>${{formatCurrency deductions.total}}</td>
      </tr>
    </table>
  </div>

  <div class="net-pay">
    <h2>Net Pay: ${{formatCurrency netPay}}</h2>
  </div>

  <div class="footer">
    <p>This is a confidential document. Please keep it secure.</p>
    <p>{{church.name}} | {{church.phone}}</p>
  </div>
</body>
</html>
  `;
}

