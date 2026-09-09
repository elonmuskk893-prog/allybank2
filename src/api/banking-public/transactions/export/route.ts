import { NextResponse } from "@/lib/next/server";
import { db } from "@/lib/db";
import { DbError } from "@/lib/db/error";

function csvCell(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function GET() {
  try {
    const { transactions } = await db.transactions(10000);
    const header = ["id", "date", "type", "amount", "status", "description", "reference"];
    const lines = transactions.map((tx) =>
      [
        tx.id,
        tx.created_at,
        tx.kind,
        tx.amount,
        tx.status,
        tx.name ?? "",
        tx.meta?.label ?? "",
      ]
        .map(csvCell)
        .join(","),
    );
    const csv = [header.map(csvCell).join(","), ...lines].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="transactions.csv"',
      },
    });
  } catch (error) {
    if (error instanceof DbError) {
      return NextResponse.json({ errorCode: error.code, error: error.message }, { status: error.status });
    }
    console.error(error);
    return NextResponse.json({ errorCode: "server_error", error: "Something went wrong." }, { status: 500 });
  }
}