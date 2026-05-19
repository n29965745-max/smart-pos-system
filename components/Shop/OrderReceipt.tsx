import React, { useRef } from 'react';

interface OrderItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

interface OrderReceiptData {
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  shippingAddress: {
    street: string;
    city: string;
    state?: string;
    postalCode?: string;
    country: string;
  };
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
  shopName: string;
  shopTagline?: string;
  shopLogo?: string;
  shopPhone?: string;
  shopEmail?: string;
  primaryColor: string;
}

interface OrderReceiptProps {
  data: OrderReceiptData;
}

export default function OrderReceipt({ data }: OrderReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const receiptHTML = receiptRef.current?.innerHTML || '';
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Order Receipt - ${data.orderNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 20px; background: white; }
          .receipt-container { max-width: 800px; margin: 0 auto; }
          @media print {
            body { padding: 0; }
            @page { size: A4; margin: 15mm; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          ${receiptHTML}
        </div>
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 100);
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const formatDate = () => {
    const now = new Date();
    return now.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Action Buttons */}
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-end gap-3 print:hidden">
        <button
          onClick={handleDownload}
          className="px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2 transition-all hover:shadow-md"
          style={{ backgroundColor: data.primaryColor, color: 'white' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download Receipt
        </button>
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-white border-2 rounded-lg font-medium text-sm flex items-center gap-2 hover:bg-gray-50 transition-all"
          style={{ borderColor: data.primaryColor, color: data.primaryColor }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Print
        </button>
      </div>

      {/* Receipt Content */}
      <div ref={receiptRef} className="p-8 bg-white">
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b-2 border-gray-300">
          {data.shopLogo ? (
            <img src={data.shopLogo} alt="Shop Logo" className="w-24 h-24 object-contain mx-auto mb-3" />
          ) : (
            <div 
              className="w-24 h-24 rounded-full flex items-center justify-center text-white text-3xl font-bold mx-auto mb-3"
              style={{ background: `linear-gradient(135deg, ${data.primaryColor}, ${data.primaryColor}dd)` }}
            >
              {data.shopName.substring(0, 2).toUpperCase()}
            </div>
          )}
          <h1 className="text-3xl font-bold mb-1" style={{ color: data.primaryColor }}>
            {data.shopName}
          </h1>
          {data.shopTagline && (
            <p className="text-sm text-gray-600 italic mb-2">{data.shopTagline}</p>
          )}
          {data.shopPhone && (
            <p className="text-sm text-gray-700">📞 {data.shopPhone}</p>
          )}
          {data.shopEmail && (
            <p className="text-sm text-gray-700">✉️ {data.shopEmail}</p>
          )}
        </div>

        {/* Receipt Title */}
        <div className="text-center mb-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: `${data.primaryColor}20` }}
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: data.primaryColor }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">ORDER RECEIPT</h2>
          <p className="text-sm text-gray-500 mt-1">{formatDate()}</p>
        </div>

        {/* Order Details */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 mb-1">Order Number</p>
              <p className="font-bold text-lg" style={{ color: data.primaryColor }}>{data.orderNumber}</p>
            </div>
            <div>
              <p className="text-gray-500 mb-1">Payment Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                data.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {data.paymentStatus.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Customer Details */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Customer Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Name</p>
              <p className="font-semibold text-gray-900">{data.customerName}</p>
            </div>
            <div>
              <p className="text-gray-500">Phone</p>
              <p className="font-semibold text-gray-900">{data.customerPhone}</p>
            </div>
            {data.customerEmail && (
              <div className="col-span-2">
                <p className="text-gray-500">Email</p>
                <p className="font-semibold text-gray-900">{data.customerEmail}</p>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        <div className="mb-6 pb-4 border-b border-gray-200">
          <h3 className="font-bold text-gray-900 mb-3">Delivery Address</h3>
          <div className="text-sm text-gray-700">
            <p>{data.shippingAddress.street}</p>
            <p>{data.shippingAddress.city}{data.shippingAddress.state ? `, ${data.shippingAddress.state}` : ''}</p>
            {data.shippingAddress.postalCode && <p>{data.shippingAddress.postalCode}</p>}
            <p>{data.shippingAddress.country}</p>
          </div>
        </div>

        {/* Order Items */}
        <div className="mb-6">
          <h3 className="font-bold text-gray-900 mb-3">Order Items</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-white" style={{ backgroundColor: data.primaryColor }}>
                <th className="text-left py-3 px-4">Item</th>
                <th className="text-center py-3 px-4">Qty</th>
                <th className="text-right py-3 px-4">Price</th>
                <th className="text-right py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="py-3 px-4 text-gray-900">{item.product_name}</td>
                  <td className="py-3 px-4 text-center font-semibold text-gray-900">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-700">KES {item.unit_price.toLocaleString()}</td>
                  <td className="py-3 px-4 text-right font-semibold text-gray-900">KES {item.subtotal.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-6 pb-4 border-t-2 border-gray-300">
          <div className="flex justify-between text-base py-2 px-4">
            <span className="text-gray-700">Subtotal</span>
            <span className="font-semibold text-gray-900">KES {data.subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-base py-2 px-4">
            <span className="text-gray-700">Delivery Fee</span>
            <span className="font-semibold text-gray-900">KES {data.deliveryFee.toLocaleString()}</span>
          </div>
          <div 
            className="flex justify-between text-xl font-bold text-white py-4 px-4 mt-2"
            style={{ backgroundColor: data.primaryColor }}
          >
            <span>TOTAL AMOUNT</span>
            <span>KES {data.total.toLocaleString()}</span>
          </div>
        </div>

        {/* Payment Method */}
        <div 
          className="rounded-lg p-4 mb-6"
          style={{ backgroundColor: `${data.primaryColor}10`, borderLeft: `4px solid ${data.primaryColor}` }}
        >
          <div className="flex justify-between items-center">
            <span className="font-semibold text-gray-900">Payment Method</span>
            <span className="font-bold" style={{ color: data.primaryColor }}>
              {data.paymentMethod.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t-2 border-dashed border-gray-300">
          <p className="text-lg font-bold mb-2" style={{ color: data.primaryColor }}>
            Thank you for your order! 🎉
          </p>
          <p className="text-sm text-gray-600 mb-1">
            We'll contact you shortly to confirm delivery details
          </p>
          <p className="text-xs text-gray-500">
            Keep this receipt for order collection and reference
          </p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container,
          .receipt-container * {
            visibility: visible !important;
          }
          .receipt-container {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
          }
          .print\\:hidden {
            display: none !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
}
