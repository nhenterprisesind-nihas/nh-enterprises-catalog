export default function OrdersPage() {
  const orders = [
    {
      orderNo: "NH202607081001000001",
      customer: "Radha",
      phone: "9876543210",
      amount: 2499,
      status: "Placed",
      date: "08-Jul-2026",
    },
  ];

  return (
    <>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">
          Orders
        </h1>

        <p className="text-slate-500 mt-1">
          View and manage customer orders.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">

        <table className="w-full">

          <thead className="bg-slate-100">

            <tr className="text-left">

              <th className="px-5 py-4">Order No</th>

              <th className="px-5 py-4">Customer</th>

              <th className="px-5 py-4">Phone</th>

              <th className="px-5 py-4">Date</th>

              <th className="px-5 py-4 text-right">Amount</th>

              <th className="px-5 py-4">Status</th>

            </tr>

          </thead>

          <tbody>

            {orders.map((order) => (
              <tr
                key={order.orderNo}
                className="border-t hover:bg-slate-50"
              >
                <td className="px-5 py-4 font-medium">
                  {order.orderNo}
                </td>

                <td className="px-5 py-4">
                  {order.customer}
                </td>

                <td className="px-5 py-4">
                  {order.phone}
                </td>

                <td className="px-5 py-4">
                  {order.date}
                </td>

                <td className="px-5 py-4 text-right font-semibold">
                  ₹{order.amount.toLocaleString("en-IN")}
                </td>

                <td className="px-5 py-4">
                  <span className="rounded-full bg-yellow-100 text-yellow-800 px-3 py-1 text-xs font-semibold">
                    {order.status}
                  </span>
                </td>
              </tr>
            ))}

          </tbody>

        </table>

      </div>
    </>
  );
}