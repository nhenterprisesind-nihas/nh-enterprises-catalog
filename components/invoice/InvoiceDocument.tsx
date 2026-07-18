import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 35,
    fontSize: 11,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },

  company: {
    textAlign: "center",
    marginBottom: 20,
  },

  companyName: {
    fontSize: 20,
    fontWeight: "bold",
  },

  title: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 20,
    textDecoration: "underline",
  },

  section: {
    marginBottom: 15,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  label: {
    fontWeight: "bold",
    width: "35%",
  },

  value: {
    width: "65%",
  },

  table: {
    borderWidth: 1,
    borderColor: "#000",
    marginTop: 10,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eeeeee",
    borderBottomWidth: 1,
    borderColor: "#000",
    fontWeight: "bold",
  },

  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "#ddd",
  },

  col1: {
    width: "52%",
    padding: 6,
  },

  col2: {
    width: "12%",
    textAlign: "center",
    padding: 6,
  },

  col3: {
    width: "18%",
    textAlign: "right",
    padding: 6,
  },

  col4: {
    width: "18%",
    textAlign: "right",
    padding: 6,
  },

  totals: {
    marginTop: 20,
    alignItems: "flex-end",
  },

  totalRow: {
    flexDirection: "row",
    width: 220,
    justifyContent: "space-between",
    marginBottom: 5,
  },

  grand: {
    fontSize: 13,
    fontWeight: "bold",
    marginTop: 6,
    borderTopWidth: 1,
    paddingTop: 6,
  },

  footer: {
    marginTop: 40,
    fontSize: 10,
    textAlign: "center",
    color: "#666",
  },
});

interface InvoiceDocumentProps {
  order: any;
  items: any[];
}

export default function InvoiceDocument({
  order,
  items,
}: InvoiceDocumentProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.company}>
          <Text style={styles.companyName}>NH ENTERPRISES</Text>
          <Text>GSTIN : 33BETPD3982A1ZM</Text>
          <Text>Phone : 9384609609</Text>
          <Text>Email : nhenterprisesind@gmail.com</Text>
        </View>

        <Text style={styles.title}>TAX INVOICE</Text>

        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Invoice No</Text>
            <Text style={styles.value}>{order.order_no}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Order No</Text>
            <Text style={styles.value}>{order.order_no}</Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Date</Text>
            <Text style={styles.value}>
              {new Date(order.created_at).toLocaleString()}
            </Text>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{order.status}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={{ fontWeight: "bold", marginBottom: 6 }}>Bill To</Text>

          <Text>{order.customer_name}</Text>
          <Text>{order.phone}</Text>
          <Text>{order.address}</Text>

          {order.pincode && <Text>{order.pincode}</Text>}
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Product</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>Price</Text>
            <Text style={styles.col4}>Amount</Text>
          </View>

          {items.map((item: any) => (
            <View style={styles.tableRow} key={item.id}>
              <Text style={styles.col1}>{item.product_name}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>
                ₹{Number(item.price).toFixed(2)}
              </Text>
              <Text style={styles.col4}>
                ₹{Number(item.amount).toFixed(2)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>₹{Number(order.subtotal).toFixed(2)}</Text>
          </View>

          <View style={styles.totalRow}>
            <Text>Shipping</Text>
            <Text>₹{Number(order.shipping).toFixed(2)}</Text>
          </View>

          <View style={[styles.totalRow, styles.grand]}>
            <Text>Grand Total</Text>
            <Text>₹{Number(order.grand_total).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Thank you for shopping with NH Enterprises.</Text>
          <Text>Goods once sold will not be taken back or exchanged.</Text>
          <Text>
            This is a computer-generated invoice and does not require a
            signature.
          </Text>
        </View>
      </Page>
    </Document>
  );
}