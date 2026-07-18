import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const [{ data: orders, error: ordersError }, { data: items, error: itemsError }] =
      await Promise.all([
        supabaseAdmin
          .from("orders")
          .select("order_no,customer_name,phone,status,grand_total,created_at")
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("order_items")
          .select("order_no,product_name,quantity,price,amount")
          .order("order_no"),
      ]);

    if (ordersError) throw ordersError;
    if (itemsError) throw itemsError;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "NH Enterprises";
    workbook.created = new Date();

    const ordersSheet = workbook.addWorksheet("Orders");
    const itemsSheet = workbook.addWorksheet("Order Items");

    ordersSheet.columns = [
      { header: "Order No", key: "order_no", width: 22 },
      { header: "Order Date", key: "created_at", width: 22 },
      { header: "Customer", key: "customer_name", width: 28 },
      { header: "Phone", key: "phone", width: 18 },
      { header: "Status", key: "status", width: 18 },
      { header: "Total Amount", key: "grand_total", width: 18 },
      { header: "No. of Items", key: "item_count", width: 15 },
    ];

    itemsSheet.columns = [
      { header: "Order No", key: "order_no", width: 22 },
      { header: "Product", key: "product_name", width: 40 },
      { header: "Qty", key: "quantity", width: 10 },
      { header: "Unit Price", key: "price", width: 15 },
      { header: "Total", key: "amount", width: 15 },
    ];

    const itemCount = new Map<string, number>();
    (items ?? []).forEach((i:any)=>{
      itemCount.set(i.order_no,(itemCount.get(i.order_no)??0)+Number(i.quantity??0));
    });

    (orders ?? []).forEach((o:any)=>{
      ordersSheet.addRow({
        ...o,
        item_count: itemCount.get(o.order_no) ?? 0,
      });
    });

    (items ?? []).forEach((i:any)=>itemsSheet.addRow(i));

    [ordersSheet, itemsSheet].forEach(ws=>{
      const header=ws.getRow(1);
      header.font={bold:true};
      header.alignment={vertical:"middle"};
      ws.views=[{state:"frozen",ySplit:1}];
      ws.autoFilter={
        from:{row:1,column:1},
        to:{row:1,column:ws.columnCount}
      };
    });

    ordersSheet.getColumn("created_at").numFmt="dd-mmm-yyyy hh:mm";
    ordersSheet.getColumn("grand_total").numFmt='₹#,##0.00';
    itemsSheet.getColumn("price").numFmt='₹#,##0.00';
    itemsSheet.getColumn("amount").numFmt='₹#,##0.00';

    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="Orders_${new Date().toISOString().slice(0,10)}.xlsx"`,
      },
    });
  } catch (e:any) {
    console.error(e);
    return NextResponse.json({ error: e.message ?? "Export failed" }, { status: 500 });
  }
}
