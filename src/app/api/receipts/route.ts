import { NextResponse } from "next/server";
import { requireAuthenticatedApiUser } from "@/lib/auth";
import { getCompanyMembershipContext } from "@/lib/company-permissions";

const ALLOWED_RECEIPT_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp"
]);

const MAX_RECEIPT_FILE_SIZE_BYTES = 10 * 1024 * 1024;

const INVALID_FILENAME_PATTERN = /[\\/\u0000-\u001f\u007f]|\.\./;
const SAFE_FILENAME_PATTERN = /^[a-zA-Z0-9._-]+$/;

function buildValidationError(code: string, message: string) {
  return NextResponse.json({ error: message, code }, { status: 400 });
}

function getFileExtension(fileName: string): string {
  const [, extension = ""] = /(?:\.([^.]+))?$/.exec(fileName) ?? [];
  return extension.toLowerCase();
}

function isUnsafeFilename(fileName: string): boolean {
  const trimmed = fileName.trim();
  if (!trimmed) return true;
  if (trimmed.startsWith(".")) return true;
  if (INVALID_FILENAME_PATTERN.test(trimmed)) return true;
  return !SAFE_FILENAME_PATTERN.test(trimmed);
}

function buildReceiptStoragePath(params: { userId: string; companyId: string; originalName: string }) {
  const extension = getFileExtension(params.originalName);
  const objectName = extension ? `${crypto.randomUUID()}.${extension}` : crypto.randomUUID();
  return `${params.userId}/${params.companyId}/${objectName}`;
}

export async function GET() {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  const { data, error } = await authContext.supabase
    .from("receipts")
    .select("id,path,created_at,transaction_id")
    .eq("company_id", membership.companyId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ receipts: data ?? [] });
}

export async function POST(req: Request) {
  const authContext = await requireAuthenticatedApiUser();
  if (!authContext) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const membership = await getCompanyMembershipContext(authContext.supabase, authContext.user.id);
  if (!membership) return NextResponse.json({ error: "No company membership found." }, { status: 404 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return buildValidationError("receipt_file_missing", "Missing file");

  if (!ALLOWED_RECEIPT_MIME_TYPES.has(file.type)) {
    return buildValidationError("receipt_file_type_not_allowed", "Unsupported file type");
  }

  if (file.size > MAX_RECEIPT_FILE_SIZE_BYTES) {
    return buildValidationError("receipt_file_too_large", "File exceeds max size limit");
  }

  if (isUnsafeFilename(file.name)) {
    return buildValidationError("receipt_filename_invalid", "Unsafe filename");
  }

  const filePath = buildReceiptStoragePath({
    userId: authContext.user.id,
    companyId: membership.companyId,
    originalName: file.name
  });

  const { error: uploadError } = await authContext.supabase.storage.from("receipts").upload(filePath, file, { upsert: false });

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data, error } = await authContext.supabase
    .from("receipts")
    .insert({ user_id: authContext.user.id, company_id: membership.companyId, path: filePath })
    .select("id,path,created_at,transaction_id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json(data, { status: 201 });
}
