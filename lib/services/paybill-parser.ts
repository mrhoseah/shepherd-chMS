import { prisma } from "@/lib/prisma";

export interface ParsedAccountNumber {
  groupCode: string | null;
  fundCode: string | null;
  groupId: string | null;
  fundCategoryId: string | null;
  isValid: boolean;
  error?: string;
}

const DELIMITER = "-";

/**
 * Parse M-Pesa Paybill account number
 * Format: GROUP_CODE-FUND_CODE (e.g., "JERICHO-TTH")
 */
export async function parseAccountNumber(
  accountNumber: string
): Promise<ParsedAccountNumber> {
  // Validate input
  if (!accountNumber || typeof accountNumber !== "string") {
    return {
      groupCode: null,
      fundCode: null,
      groupId: null,
      fundCategoryId: null,
      isValid: false,
      error: "Account number is required",
    };
  }

  // Trim whitespace and convert to uppercase
  const trimmed = accountNumber.trim().toUpperCase();

  // Check if delimiter exists
  if (!trimmed.includes(DELIMITER)) {
    return {
      groupCode: null,
      fundCode: null,
      groupId: null,
      fundCategoryId: null,
      isValid: false,
      error: "Invalid format: missing delimiter",
    };
  }

  // Split by delimiter
  const parts = trimmed.split(DELIMITER);
  if (parts.length !== 2) {
    return {
      groupCode: null,
      fundCode: null,
      groupId: null,
      fundCategoryId: null,
      isValid: false,
      error: "Invalid format: expected GROUP_CODE-FUND_CODE",
    };
  }

  const [groupCode, fundCode] = parts.map((p) => p.trim());

  // Validate codes are not empty
  if (!groupCode || !fundCode) {
    return {
      groupCode: null,
      fundCode: null,
      groupId: null,
      fundCategoryId: null,
      isValid: false,
      error: "Invalid format: group code or fund code is empty",
    };
  }

  // Validate codes are alphanumeric only
  const alphanumericRegex = /^[A-Z0-9]+$/;
  if (!alphanumericRegex.test(groupCode) || !alphanumericRegex.test(fundCode)) {
    return {
      groupCode: null,
      fundCode: null,
      groupId: null,
      fundCategoryId: null,
      isValid: false,
      error: "Invalid format: codes must be alphanumeric only",
    };
  }

  // Lookup group by code
  const group = await prisma.smallGroup.findUnique({
    where: { groupCode: groupCode },
    select: { id: true, name: true, groupGivingEnabled: true },
  });

  if (!group) {
    return {
      groupCode,
      fundCode,
      groupId: null,
      fundCategoryId: null,
      isValid: false,
      error: `Unknown group code: ${groupCode}`,
    };
  }

  if (!group.groupGivingEnabled) {
    return {
      groupCode,
      fundCode,
      groupId: group.id,
      fundCategoryId: null,
      isValid: false,
      error: `Group giving is not enabled for ${group.name}`,
    };
  }

  // Lookup fund category by code
  const fundCategory = await prisma.fundCategory.findUnique({
    where: { code: fundCode },
    select: { id: true, name: true, isActive: true },
  });

  if (!fundCategory) {
    return {
      groupCode,
      fundCode,
      groupId: group.id,
      fundCategoryId: null,
      isValid: false,
      error: `Unknown fund code: ${fundCode}`,
    };
  }

  if (!fundCategory.isActive) {
    return {
      groupCode,
      fundCode,
      groupId: group.id,
      fundCategoryId: fundCategory.id,
      isValid: false,
      error: `Fund category ${fundCategory.name} is not active`,
    };
  }

  // Successfully parsed
  return {
    groupCode,
    fundCode,
    groupId: group.id,
    fundCategoryId: fundCategory.id,
    isValid: true,
  };
}

/**
 * Generate account number from group and fund codes
 */
export function generateAccountNumber(groupCode: string, fundCode: string): string {
  return `${groupCode.toUpperCase()}-${fundCode.toUpperCase()}`;
}

/**
 * Validate group code format
 */
export function validateGroupCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Group code is required" };
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length < 3 || trimmed.length > 10) {
    return { valid: false, error: "Group code must be 3-10 characters" };
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: "Group code must be alphanumeric only" };
  }

  if (trimmed.includes("-")) {
    return { valid: false, error: "Group code cannot contain the delimiter (-)" };
  }

  return { valid: true };
}

/**
 * Validate fund code format
 */
export function validateFundCode(code: string): { valid: boolean; error?: string } {
  if (!code || code.trim().length === 0) {
    return { valid: false, error: "Fund code is required" };
  }

  const trimmed = code.trim().toUpperCase();

  if (trimmed.length < 3 || trimmed.length > 5) {
    return { valid: false, error: "Fund code must be 3-5 characters" };
  }

  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    return { valid: false, error: "Fund code must be alphanumeric only" };
  }

  if (trimmed.includes("-")) {
    return { valid: false, error: "Fund code cannot contain the delimiter (-)" };
  }

  return { valid: true };
}

