import { NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import Papa from "papaparse";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  calculateCgstSgst,
  calculateIgst,
  getGstRate,
} from "@/lib/gst";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderItem = {
  id: number;
  product_name: string;
  quantity: number;
  price: number;
  amount: number;
};

type SheetProduct = {
  name?: string;
  category?: string;
};

const PAGE = {
  LEFT: 40,
  RIGHT: 555,
};

const money = (value: number | string | null | undefined) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));

const normalizeProductName = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

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

  drawBox(doc, 40, y, 510, 34);

  doc.font("Helvetica-Bold");
  doc.fontSize(8);

  doc.text("Sl", 45, y + 11, {
    width: 20,
    align: "center",
  });

  doc.text("Product", 72, y + 11, {
    width: 145,
  });

  doc.text("Qty", 218, y + 11, {
    width: 35,
    align: "center",
  });

  doc.text("Rate", 255, y + 11, {
    width: 60,
    align: "right",
  });

  doc.text("GST", 320, y + 11, {
    width: 45,
    align: "center",
  });

  doc.text("Taxable", 368, y + 11, {
    width: 75,
    align: "right",
  });

  doc.text("Total", 448, y + 11, {
    width: 95,
    align: "right",
  });

  doc.font("Helvetica");

  doc.y = y + 40;
}

function ensurePage(doc: PDFKit.PDFDocument) {
  if (doc.y < 700) return;

  doc.addPage();
  drawTableHeader(doc);
}

async function getProductCategories(): Promise<Map<string, string>> {
  const sheetUrl = process.env.NEXT_PUBLIC_SHEET_URL;

  if (!sheetUrl) {
    console.error("NEXT_PUBLIC_SHEET_URL is not configured.");
    return new Map();
  }

  try {
    const cacheBuster =
      (sheetUrl.includes("?") ? "&" : "?") +
      "t=" +
      Date.now();

    const response = await fetch(sheetUrl + cacheBuster, {
      cache: "no-store",
    });

    if (!response.ok) {
      console.error(
        "Unable to fetch product Google Sheet:",
        response.status
      );

      return new Map();
    }

    const csvText = await response.text();

    const parsed = Papa.parse<SheetProduct>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const categories = new Map<string, string>();

    for (const product of parsed.data) {
      if (!product.name) continue;

      categories.set(
        normalizeProductName(product.name),
        product.category?.trim() || ""
      );
    }

    return categories;
  } catch (error) {
    console.error(
      "Unable to read product Google Sheet:",
      error
    );

    return new Map();
  }
}

/**
 * Determines whether the delivery address clearly indicates
 * an Indian state other than Tamil Nadu.
 *
 * If no other state is clearly identified, the invoice
 * defaults to CGST + SGST as requested.
 */
function detectInterState(address: string): boolean {
  const normalized = address.toLowerCase();

  const tamilNaduIndicators = [
    "tamil nadu",
    "tamilnadu",
    "chennai",
    "coimbatore",
    "madurai",
    "trichy",
    "tiruchirappalli",
    "salem",
    "tiruppur",
    "erode",
    "vellore",
    "thoothukudi",
    "tuticorin",
    "thanjavur",
    "tirunelveli",
    "kanchipuram",
    "chengalpattu",
    "avadi",
    "ambattur",
    "mogappair",
    "kolathur",
  ];

  if (
    tamilNaduIndicators.some((term) =>
      normalized.includes(term)
    )
  ) {
    return false;
  }

  const otherStateIndicators = [
    "andhra pradesh",
    "arunachal pradesh",
    "assam",
    "bihar",
    "chhattisgarh",
    "goa",
    "gujarat",
    "haryana",
    "himachal pradesh",
    "jharkhand",
    "karnataka",
    "kerala",
    "madhya pradesh",
    "maharashtra",
    "manipur",
    "meghalaya",
    "mizoram",
    "nagaland",
    "odisha",
    "punjab",
    "rajasthan",
    "sikkim",
    "telangana",
    "tripura",
    "uttar pradesh",
    "uttarakhand",
    "west bengal",
    "andaman and nicobar",
    "chandigarh",
    "dadra and nagar haveli",
    "daman and diu",
    "delhi",
    "jammu and kashmir",
    "ladakh",
    "lakshadweep",
    "puducherry",
  ];

  return otherStateIndicators.some((term) =>
    normalized.includes(term)
  );
}

function drawWrappedText(
  doc: PDFKit.PDFDocument,
  text: string,
  x: number,
  y: number,
  width: number
) {
  doc.text(text || "-", x, y, {
    width,
    height: 100,
    ellipsis: true,
  });
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ orderNo: string }>;
  }
) {
  const { orderNo } = await params;

  // ==================================================
  // GET ORDER
  // ==================================================

  const { data: order, error: orderError } =
    await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("order_no", orderNo)
      .single();

  if (orderError || !order) {
    return NextResponse.json(
      {
        error: "Order not found",
      },
      {
        status: 404,
      }
    );
  }

  // ==================================================
  // GET ORDER ITEMS
  // ==================================================

  const { data: items, error: itemError } =
    await supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_no", orderNo)
      .order("id");

  if (itemError) {
    return NextResponse.json(
      {
        error: "Unable to load order items.",
      },
      {
        status: 500,
      }
    );
  }

  // ==================================================
  // GET PRODUCT CATEGORIES FROM GOOGLE SHEET
  // ==================================================

  const categoryMap = await getProductCategories();

  // ==================================================
  // PREPARE GST ITEMS
  // ==================================================

  const invoiceItems = (
    (items ?? []) as OrderItem[]
  ).map((item) => {
    const category =
      categoryMap.get(
        normalizeProductName(item.product_name)
      ) || "";

    /*
     * getGstRate() automatically returns:
     *
     * Jewellery       = 3%
     * Saree           = 5%
     * Stationery      = 12%
     * Unknown/missing = 18%
     */

    const gstRate = getGstRate(category);

    const taxableValue = Number(
      item.amount ?? item.price * item.quantity
    );

    const gstAmount = Number(
      ((taxableValue * gstRate) / 100).toFixed(2)
    );

    return {
      ...item,
      category,
      gstRate,
      taxableValue,
      gstAmount,
    };
  });

  // ==================================================
  // DETERMINE CGST+SGST / IGST
  // ==================================================

  const address = String(order.address ?? "");

  const interState = detectInterState(address);

  // ==================================================
  // TOTALS
  // ==================================================

  const totalTaxableValue = invoiceItems.reduce(
    (sum, item) => sum + item.taxableValue,
    0
  );

  const totalGst = invoiceItems.reduce(
    (sum, item) => sum + item.gstAmount,
    0
  );

  const shipping = Number(order.shipping ?? 0);

  /*
   * Shipping is kept separate from the GST calculation
   * in this implementation.
   */

  const grandTotal = Number(
    (
      totalTaxableValue +
      totalGst +
      shipping
    ).toFixed(2)
  );

  // ==================================================
  // GROUP GST BY RATE
  // ==================================================

  const groupedRates = new Map<
    number,
    {
      taxableValue: number;
      gstAmount: number;
    }
  >();

  for (const item of invoiceItems) {
    const current =
      groupedRates.get(item.gstRate) || {
        taxableValue: 0,
        gstAmount: 0,
      };

    current.taxableValue += item.taxableValue;
    current.gstAmount += item.gstAmount;

    groupedRates.set(
      item.gstRate,
      current
    );
  }

  // ==================================================
  // CREATE PDF
  // ==================================================

  const doc = new PDFDocument({
    margin: 40,
    size: "A4",
    bufferPages: true,
  });

  const buffers: Buffer[] = [];

  doc.on("data", (chunk) => {
    buffers.push(chunk);
  });

  const pdfBuffer: Buffer =
    await new Promise((resolve) => {
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

      doc.text(
        "GSTIN : 33BETPD3982A1ZM",
        {
          align: "center",
        }
      );

      doc.text(
        "Email : nhenterprisesind@gmail.com",
        {
          align: "center",
        }
      );

      doc.moveDown(0.6);

      drawLine(doc, doc.y);

      doc.moveDown();

      doc.font("Helvetica-Bold");
      doc.fontSize(18);

      doc.text("TAX INVOICE", {
        align: "center",
      });

      doc.moveDown();

      // ==================================================
      // INVOICE DATE
      // ==================================================

      const invoiceDate =
        new Date(
          order.created_at
        ).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        });

      const top = doc.y;

      // ==================================================
      // CUSTOMER / INVOICE DETAILS
      // ==================================================

      drawBox(
        doc,
        40,
        top,
        245,
        135
      );

      drawBox(
        doc,
        305,
        top,
        245,
        135
      );

      doc.font("Helvetica-Bold");
      doc.fontSize(11);

      doc.text(
        "Bill To",
        50,
        top + 10
      );

      doc.font("Helvetica");
      doc.fontSize(10);

      drawWrappedText(
        doc,
        String(
          order.customer_name ?? ""
        ),
        50,
        top + 35,
        220
      );

      drawWrappedText(
        doc,
        String(
          order.address ?? "-"
        ),
        50,
        top + 55,
        220
      );

      doc.text(
        "Phone : " +
          String(order.phone ?? "-"),
        50,
        top + 105
      );

      // ==================================================
      // INVOICE DETAILS
      // ==================================================

      doc.font("Helvetica-Bold");

      doc.text(
        "Invoice Details",
        315,
        top + 10
      );

      doc.font("Helvetica");

      doc.text(
        "Invoice No : " +
          String(order.order_no),
        315,
        top + 35
      );

      doc.text(
        "Date : " +
          invoiceDate,
        315,
        top + 55
      );

      doc.text(
        "Supply Type : " +
          (
            interState
              ? "Inter-State (IGST)"
              : "Intra-State (CGST + SGST)"
          ),
        315,
        top + 75,
        {
          width: 220,
        }
      );

      doc.text(
        "Place of Supply : " +
          (
            interState
              ? "Outside Tamil Nadu"
              : "Tamil Nadu / Default"
          ),
        315,
        top + 105,
        {
          width: 220,
        }
      );

      doc.y = top + 155;

      // ==================================================
      // ITEM TABLE
      // ==================================================

      drawTableHeader(doc);

      let sl = 1;

      for (const item of invoiceItems) {
        ensurePage(doc);

        const y = doc.y;

        const productHeight =
          doc.heightOfString(
            item.product_name ?? "",
            {
              width: 140,
            }
          );

        const actualRowHeight =
          Math.max(
            34,
            productHeight + 14
          );

        drawBox(
          doc,
          40,
          y - 2,
          510,
          actualRowHeight
        );

        const separators = [
          70,
          218,
          255,
          320,
          368,
          448,
        ];

        for (const x of separators) {
          doc
            .moveTo(x, y - 2)
            .lineTo(
              x,
              y +
                actualRowHeight -
                2
            )
            .stroke();
        }

        doc.font("Helvetica");
        doc.fontSize(8);

        doc.text(
          String(sl),
          45,
          y + 11,
          {
            width: 20,
            align: "center",
          }
        );

        doc.text(
          item.product_name ?? "",
          73,
          y + 7,
          {
            width: 140,
          }
        );

        doc.text(
          String(item.quantity),
          218,
          y + 11,
          {
            width: 35,
            align: "center",
          }
        );

        doc.text(
          money(item.price),
          255,
          y + 11,
          {
            width: 60,
            align: "right",
          }
        );

        doc.text(
          item.gstRate + "%",
          320,
          y + 11,
          {
            width: 45,
            align: "center",
          }
        );

        doc.text(
          money(
            item.taxableValue
          ),
          368,
          y + 11,
          {
            width: 75,
            align: "right",
          }
        );

        doc.text(
          money(
            item.taxableValue +
              item.gstAmount
          ),
          448,
          y + 11,
          {
            width: 95,
            align: "right",
          }
        );

        doc.y =
          y +
          actualRowHeight;

        sl++;
      }

      // ==================================================
      // GST SUMMARY
      // ==================================================

      doc.moveDown();

      const taxTop =
        doc.y + 5;

      doc.font("Helvetica-Bold");
      doc.fontSize(10);

      doc.text(
        "GST Summary",
        PAGE.LEFT,
        taxTop
      );

      let taxY =
        taxTop + 18;

      drawBox(
        doc,
        PAGE.LEFT,
        taxY,
        510,
        24
      );

      doc.font("Helvetica-Bold");
      doc.fontSize(8);

      doc.text(
        "GST Rate",
        50,
        taxY + 8,
        {
          width: 70,
          align: "center",
        }
      );

      doc.text(
        "Taxable Value",
        135,
        taxY + 8,
        {
          width: 100,
          align: "right",
        }
      );

      if (interState) {
        doc.text(
          "IGST",
          300,
          taxY + 8,
          {
            width: 90,
            align: "right",
          }
        );
      } else {
        doc.text(
          "CGST",
          280,
          taxY + 8,
          {
            width: 75,
            align: "right",
          }
        );

        doc.text(
          "SGST",
          380,
          taxY + 8,
          {
            width: 75,
            align: "right",
          }
        );
      }

      doc.text(
        "Total GST",
        465,
        taxY + 8,
        {
          width: 75,
          align: "right",
        }
      );

      taxY += 24;

      doc.font("Helvetica");

      for (const [
        rate,
        values,
      ] of Array.from(
        groupedRates.entries()
      ).sort(
        (a, b) => a[0] - b[0]
      )) {
        drawBox(
          doc,
          PAGE.LEFT,
          taxY,
          510,
          24
        );

        const split = interState
          ? calculateIgst(
              values.taxableValue,
              rate
            )
          : calculateCgstSgst(
              values.taxableValue,
              rate
            );

        doc.text(
          rate + "%",
          50,
          taxY + 8,
          {
            width: 70,
            align: "center",
          }
        );

        doc.text(
          money(
            values.taxableValue
          ),
          135,
          taxY + 8,
          {
            width: 100,
            align: "right",
          }
        );

        if (interState) {
          doc.text(
            money(
              split.igstAmount
            ),
            300,
            taxY + 8,
            {
              width: 90,
              align: "right",
            }
          );
        } else {
          doc.text(
            money(
              split.cgstAmount
            ),
            280,
            taxY + 8,
            {
              width: 75,
              align: "right",
            }
          );

          doc.text(
            money(
              split.sgstAmount
            ),
            380,
            taxY + 8,
            {
              width: 75,
              align: "right",
            }
          );
        }

        doc.text(
          money(
            values.gstAmount
          ),
          465,
          taxY + 8,
          {
            width: 75,
            align: "right",
          }
        );

        taxY += 24;
      }

      // ==================================================
      // TOTALS
      // ==================================================

      const totalsTop =
        taxY + 15;

      const boxWidth = 230;
      const boxHeight = 116;
      const boxLeft =
        PAGE.RIGHT -
        boxWidth;

      drawBox(
        doc,
        boxLeft,
        totalsTop,
        boxWidth,
        boxHeight
      );

      doc.font("Helvetica");
      doc.fontSize(9);

      doc.text(
        "Taxable Value",
        boxLeft + 10,
        totalsTop + 10
      );

      doc.text(
        "₹ " +
          money(
            totalTaxableValue
          ),
        boxLeft + 110,
        totalsTop + 10,
        {
          width: 105,
          align: "right",
        }
      );

      if (interState) {
        doc.text(
          "IGST",
          boxLeft + 10,
          totalsTop + 34
        );

        doc.text(
          "₹ " +
            money(totalGst),
          boxLeft + 110,
          totalsTop + 34,
          {
            width: 105,
            align: "right",
          }
        );

        doc.text(
          "Shipping",
          boxLeft + 10,
          totalsTop + 58
        );

        doc.text(
          "₹ " +
            money(shipping),
          boxLeft + 110,
          totalsTop + 58,
          {
            width: 105,
            align: "right",
          }
        );
      } else {
        const totalCgst =
          Number(
            (totalGst / 2).toFixed(
              2
            )
          );

        const totalSgst =
          Number(
            (
              totalGst -
              totalCgst
            ).toFixed(2)
          );

        doc.text(
          "CGST",
          boxLeft + 10,
          totalsTop + 34
        );

        doc.text(
          "₹ " +
            money(totalCgst),
          boxLeft + 110,
          totalsTop + 34,
          {
            width: 105,
            align: "right",
          }
        );

        doc.text(
          "SGST",
          boxLeft + 10,
          totalsTop + 58
        );

        doc.text(
          "₹ " +
            money(totalSgst),
          boxLeft + 110,
          totalsTop + 58,
          {
            width: 105,
            align: "right",
          }
        );

        doc.text(
          "Shipping",
          boxLeft + 10,
          totalsTop + 82
        );

        doc.text(
          "₹ " +
            money(shipping),
          boxLeft + 110,
          totalsTop + 82,
          {
            width: 105,
            align: "right",
          }
        );
      }

      const grandTotalY =
        interState
          ? totalsTop + 82
          : totalsTop + 106;

      doc.font("Helvetica-Bold");
      doc.fontSize(11);

      doc.text(
        "Grand Total",
        boxLeft + 10,
        grandTotalY
      );

      doc.text(
        "₹ " +
          money(grandTotal),
        boxLeft + 100,
        grandTotalY,
        {
          width: 115,
          align: "right",
        }
      );

      doc.y =
        totalsTop +
        boxHeight +
        20;

      // ==================================================
      // FOOTER
      // ==================================================

      const footerY = 720;

      doc
        .moveTo(
          PAGE.LEFT,
          footerY - 15
        )
        .lineTo(
          PAGE.RIGHT,
          footerY - 15
        )
        .stroke();

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

      doc.text(
        "This is a computer-generated tax invoice.",
        PAGE.LEFT,
        footerY + 18,
        {
          width: 260,
        }
      );

      const signLeft = 360;

      drawBox(
        doc,
        signLeft,
        footerY - 5,
        180,
        70
      );

      const signatureFont =
        path.join(
          process.cwd(),
          "fonts",
          "GreatVibes-Regular.ttf"
        );

      try {
        doc.font(signatureFont);
        doc.fontSize(22);

        doc.text(
          "Dillyrani",
          signLeft,
          footerY + 8,
          {
            width: 180,
            align: "center",
          }
        );
      } catch {
        doc.font("Helvetica-Bold");
        doc.fontSize(14);

        doc.text(
          "Dillyrani",
          signLeft,
          footerY + 12,
          {
            width: 180,
            align: "center",
          }
        );
      }

      doc.font("Helvetica");
      doc.fontSize(10);

      doc.text(
        "Authorized Signatory",
        signLeft,
        footerY + 42,
        {
          width: 180,
          align: "center",
        }
      );

      doc.font("Helvetica-Bold");

      doc.text(
        "NH ENTERPRISES",
        signLeft,
        footerY + 56,
        {
          width: 180,
          align: "center",
        }
      );

      // ==================================================
      // PAGE NUMBERS
      // ==================================================

      const range =
        doc.bufferedPageRange();

      for (
        let i = 0;
        i < range.count;
        i++
      ) {
        doc.switchToPage(i);

        doc.font("Helvetica");
        doc.fontSize(8);

        doc.text(
          "Page " +
            (i + 1) +
            " of " +
            range.count,
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

  const uint8Array =
    new Uint8Array(pdfBuffer);

  return new Response(
    uint8Array,
    {
      headers: {
        "Content-Type":
          "application/pdf",

        "Content-Disposition":
          "attachment; filename=GST-Invoice-" +
          orderNo +
          ".pdf",

        "Cache-Control":
          "no-store",
      },
    }
  );
}