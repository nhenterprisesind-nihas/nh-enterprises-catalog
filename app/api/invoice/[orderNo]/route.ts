import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
};

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

const PAGE = {
  LEFT: 40,
  RIGHT: 555,
  TOP: 40,
  BOTTOM: 760,
};

const TABLE = {
  SL: 40,
  PRODUCT: 70,
  QTY: 330,
  RATE: 390,
  AMOUNT: 470,
};

function drawLine(doc: PDFKit.PDFDocument, y: number) {
  doc
    .moveTo(PAGE.LEFT, y)
    .lineTo(PAGE.RIGHT, y)
    .stroke();
}

function drawBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  w: number,
  h: number
) {
  doc.rect(x, y, w, h).stroke();
}

function drawTableHeader(doc: PDFKit.PDFDocument) {
  const y = doc.y;

  drawBox(doc, 40, y, 510, 24);

  doc.font("Helvetica-Bold");
  doc.fontSize(10);

  doc.text("Sl", TABLE.SL + 6, y + 7);

  doc.text("Product", TABLE.PRODUCT + 5, y + 7);

  doc.text("Qty", TABLE.QTY, y + 7, {
    width: 40,
    align: "center",
  });

  doc.text("Rate", TABLE.RATE, y + 7, {
    width: 60,
    align: "right",
  });

  doc.text("Amount", TABLE.AMOUNT, y + 7, {
    width: 70,
    align: "right",
  });

  doc.font("Helvetica");

  doc.y = y + 30;
}

function ensurePage(doc: PDFKit.PDFDocument) {
  if (doc.y < 700) return;

  doc.addPage();

  drawTableHeader(doc);
}
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderNo: string }> }
) {
  const { orderNo } = await params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("order_no", orderNo)
    .single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: "Order not found" },
      { status: 404 }
    );
  }

  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("*")
    .eq("order_no", orderNo)
    .order("id");

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    bufferPages: true,
  });

  const buffers: Buffer[] = [];

  doc.on("data", (chunk) => buffers.push(chunk));

  const pdfBuffer: Buffer = await new Promise((resolve) => {

    doc.on("end", () => {
      resolve(Buffer.concat(buffers));
    });

    // ==================================================
    // HEADER
    // ==================================================

    doc.font("Helvetica-Bold");
    doc.fontSize(22);

    doc.text("NH ENTERPRISES", {
      align: "center",
    });

    doc.font("Helvetica");
    doc.fontSize(10);

    doc.text("Chennai, Tamil Nadu", {
      align: "center",
    });

    doc.text("Email : nhenterprisesind@gmail.com", {
      align: "center",
    });

    doc.moveDown(0.6);

    drawLine(doc, doc.y);

    doc.moveDown();

    doc.font("Helvetica-Bold");
    doc.fontSize(18);

    doc.text("TAX INVOICE", {
      align: "center",
    });

    doc.moveDown();

    const invoiceDate = new Date(
      order.created_at
    ).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const top = doc.y;

    drawBox(doc, 40, top, 245, 110);
    drawBox(doc, 305, top, 245, 110);

    // =============================
    // BILL TO
    // =============================

    doc.font("Helvetica-Bold");
    doc.fontSize(12);

    doc.text("Bill To", 50, top + 10);

    doc.font("Helvetica");
    doc.fontSize(10);

    doc.text(order.customer_name ?? "", 50, top + 35);

    doc.text(order.address ?? "-");

    doc.text(`Phone : ${order.phone ?? "-"}`);

    doc.text(`Pincode : ${order.pincode ?? "-"}`);

    // =============================
    // INVOICE DETAILS
    // =============================

    doc.font("Helvetica-Bold");

    doc.text("Invoice Details", 315, top + 10);

    doc.font("Helvetica");

    doc.text(
      `Invoice No : ${order.order_no}`,
      315,
      top + 35
    );

    doc.text(`Date : ${invoiceDate}`);

    doc.text(`Status : ${order.status}`);

    doc.y = top + 130;

    drawTableHeader(doc);

    // ==================================================
    // ITEMS
    // ==================================================

    let sl = 1;

    const rowHeight = 24;

    for (const item of (items ?? []) as OrderItem[]) {

      ensurePage(doc);

      const y = doc.y;

      drawBox(doc, 40, y - 2, 510, rowHeight);

      // Vertical column separators

      doc.moveTo(70, y - 2).lineTo(70, y + rowHeight - 2).stroke();
      doc.moveTo(325, y - 2).lineTo(325, y + rowHeight - 2).stroke();
      doc.moveTo(380, y - 2).lineTo(380, y + rowHeight - 2).stroke();
      doc.moveTo(460, y - 2).lineTo(460, y + rowHeight - 2).stroke();

      doc.font("Helvetica");
      doc.fontSize(10);

      doc.text(
        String(sl),
        45,
        y + 6,
        {
          width: 20,
          align: "center",
        }
      );

      const productHeight = doc.heightOfString(
      item.product_name ?? "",
      {
        width: 240,
      }
    );

    const actualRowHeight = Math.max(24, productHeight + 10);

    drawBox(doc, 40, y - 2, 510, actualRowHeight);

    doc.moveTo(70, y - 2).lineTo(70, y + actualRowHeight - 2).stroke();
    doc.moveTo(325, y - 2).lineTo(325, y + actualRowHeight - 2).stroke();
    doc.moveTo(380, y - 2).lineTo(380, y + actualRowHeight - 2).stroke();
    doc.moveTo(460, y - 2).lineTo(460, y + actualRowHeight - 2).stroke();

    doc.text(
      item.product_name ?? "",
      75,
      y + 6,
      {
        width: 240,
      }
    );

    doc.text(
      String(item.quantity),
      330,
      y + 6,
      {
        width: 40,
        align: "center",
      }
    );

    doc.text(
      money(item.price),
      390,
      y + 6,
      {
        width: 60,
        align: "right",
      }
    );

    doc.text(
      money(item.amount),
      470,
      y + 6,
      {
        width: 70,
        align: "right",
      }
    );

    doc.y = y + actualRowHeight;

      doc.text(
        String(item.quantity),
        330,
        y + 6,
        {
          width: 40,
          align: "center",
        }
      );

      doc.text(
        money(item.price),
        390,
        y + 6,
        {
          width: 60,
          align: "right",
        }
      );

      doc.text(
        money(item.amount),
        470,
        y + 6,
        {
          width: 70,
          align: "right",
        }
      );

      doc.y = y + rowHeight;

      sl++;
    }

    doc.moveDown();
        // ==================================================
    // TOTALS
    // ==================================================

    const totalsTop = doc.y + 10;

    const boxWidth = 190;
    const boxHeight = 88;
    const boxLeft = PAGE.RIGHT - boxWidth;

    drawBox(doc, boxLeft, totalsTop, boxWidth, boxHeight);

    // Row separators

    doc.moveTo(boxLeft, totalsTop + 28)
      .lineTo(boxLeft + boxWidth, totalsTop + 28)
      .stroke();

    doc.moveTo(boxLeft, totalsTop + 56)
      .lineTo(boxLeft + boxWidth, totalsTop + 56)
      .stroke();

    // Subtotal

    doc.font("Helvetica");
    doc.fontSize(10);

    doc.text(
      "Subtotal",
      boxLeft + 10,
      totalsTop + 8
    );

    doc.text(
      `₹ ${money(order.subtotal)}`,
      boxLeft + 90,
      totalsTop + 8,
      {
        width: 90,
        align: "right",
      }
    );

    // Shipping

    doc.text(
      "Shipping",
      boxLeft + 10,
      totalsTop + 36
    );

    doc.text(
      `₹ ${money(order.shipping)}`,
      boxLeft + 90,
      totalsTop + 36,
      {
        width: 90,
        align: "right",
      }
    );

    // Grand Total

    doc.font("Helvetica-Bold");
    doc.fontSize(12);

    doc.text(
      "Grand Total",
      boxLeft + 10,
      totalsTop + 64
    );

    doc.text(
      `₹ ${money(order.grand_total)}`,
      boxLeft + 80,
      totalsTop + 64,
      {
        width: 100,
        align: "right",
      }
    );

    doc.y = totalsTop + boxHeight + 20;
        // ==================================================
    // FOOTER
    // ==================================================

    const footerY = 720;

    // Footer divider

    doc.moveTo(PAGE.LEFT, footerY - 15)
      .lineTo(PAGE.RIGHT, footerY - 15)
      .stroke();

    // Left side

    doc.font("Helvetica");
    doc.fontSize(9);

    doc.text(
      "Thank you for shopping with NH Enterprises.",
      PAGE.LEFT,
      footerY,
      {
        width: 250,
      }
    );

    doc.moveDown(0.3);

    doc.text(
      "This is a computer-generated invoice and does not require a physical signature.",
      PAGE.LEFT,
      doc.y,
      {
        width: 260,
      }
    );

    // Right side

    const signLeft = 360;

    drawBox(doc, signLeft, footerY - 5, 180, 70);

    doc.font("Helvetica-Bold");
    doc.fontSize(10);

    doc.text(
      "For NH ENTERPRISES",
      signLeft,
      footerY + 8,
      {
        width: 180,
        align: "center",
      }
    );

    doc.font("Helvetica");

    doc.text(
      "Authorized Signatory",
      signLeft,
      footerY + 50,
      {
        width: 180,
        align: "center",
      }
    );

    // ==================================================
    // PAGE NUMBERS
    // ==================================================

    const range = doc.bufferedPageRange();

    for (let i = 0; i < range.count; i++) {

      doc.switchToPage(i);

      doc.font("Helvetica");

      doc.fontSize(8);

      doc.text(
        `Page ${i + 1} of ${range.count}`,
        PAGE.LEFT,
        780,
        {
          width: 510,
          align: "center",
        }
      );
    }

    doc.end();
      });

  // ==================================================
  // RETURN PDF
  // ==================================================

  const uint8Array = new Uint8Array(pdfBuffer);

  return new Response(uint8Array, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=Invoice-${orderNo}.pdf`,
      "Cache-Control": "no-store",
    },
  });
}
