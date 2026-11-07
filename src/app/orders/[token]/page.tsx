"use client";

import React, { useState, useEffect, use } from "react";
import Link from "next/link";
import { storeService, OrderData, StoreData } from "@/lib/store-service";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from "lucide-react";
import { getStoreUrl } from "@/lib/config/site";
import { StatusScreen } from "@/components/ui/status-screen";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function OrderTrackingPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const allStores = storeService.getAllStores();
    for (const s of allStores) {
      const foundOrder = s.orders.find((o) => o.token === token);
      if (foundOrder) {
        setOrder(foundOrder);
        setStore(s);
        break;
      }
    }
    setLoading(false);
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-neutral-500 font-medium">Finding your order…</p>
        </div>
      </div>
    );
  }

  if (!order || !store) {
    return (
      <StatusScreen
        icon={AlertCircle}
        eyebrow="Order tracking"
        title="We can't find this order"
        text="This tracking link is invalid or has expired. Check the link the shop sent you."
        actions={[{ label: "Go to the home page", href: "/" }]}
      />
    );
  }

  const steps = [
    { key: "placed", label: "Placed", desc: "Recorded in seller catalog" },
    { key: "confirmed", label: "Confirmed", desc: "Payment verified" },
    { key: "packed", label: "Packed", desc: "Ready for courier dispatch" },
    { key: "shipped", label: "Shipped", desc: "In transit with carrier" },
    { key: "delivered", label: "Delivered", desc: "Delivered to recipient" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === order.fulfilmentStatus);

  return (
    <div className="home-sans min-h-screen bg-neutral-50 text-neutral-900 flex flex-col font-[Inter,sans-serif]">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={getStoreUrl(store.subdomain)}
            className="flex items-center gap-2 text-xs font-semibold text-neutral-600 hover:text-black"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {store.name}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Badge variant="neutral" className="text-xs">
              Order {order.number}
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-4 py-8 w-full space-y-5">
        {/* Status Card */}
        <div className="p-6 rounded-lg bg-white border border-neutral-200 shadow-xs">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Live Fulfilment Tracker
              </span>
              <h2 className="text-2xl font-bold text-neutral-900 mt-0.5">
                {order.fulfilmentStatus === "delivered"
                  ? "Delivered Successfully"
                  : order.fulfilmentStatus === "shipped"
                  ? "Out For Delivery"
                  : order.fulfilmentStatus === "cancelled"
                  ? "Order Cancelled"
                  : "Order In Progress"}
              </h2>
              <p className="text-xs text-neutral-500 mt-1">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-xs text-neutral-400">Total Amount</span>
              <span className="text-xl font-bold text-neutral-900">
                ₹{(order.total / 100).toLocaleString("en-IN")}
              </span>
              <Badge
                className={`mt-1 text-[10px] ${
                  order.paymentStatus === "paid" || order.paymentStatus === "verified"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                } border-0 font-medium`}
              >
                {order.paymentMethod.toUpperCase()} • {order.paymentStatus.replace("_", " ")}
              </Badge>
            </div>
          </div>

          {/* Stepper */}
          <div className="mt-8 pt-6 border-t border-neutral-100">
            <div className="relative flex justify-between">
              <div className="absolute top-4 left-4 right-4 h-0.5 bg-neutral-200 -z-0" />
              <div
                className="absolute top-4 left-4 h-0.5 bg-neutral-900 transition-all duration-500 -z-0"
                style={{
                  width: `${(Math.max(0, currentStepIndex) / (steps.length - 1)) * 100}%`,
                }}
              />

              {steps.map((step, idx) => {
                const isPassed = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;

                return (
                  <div key={step.key} className="flex flex-col items-center text-center relative z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPassed
                          ? "bg-neutral-900 text-white shadow-xs"
                          : "bg-white text-neutral-400 border border-neutral-300"
                      }`}
                    >
                      {isPassed ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`mt-2 text-xs font-semibold ${
                        isCurrent ? "text-neutral-950 font-bold" : isPassed ? "text-neutral-800" : "text-neutral-400"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier tracking link if shipped */}
          {order.courierName && (
            <div className="mt-6 p-4 rounded-md bg-neutral-50 border border-neutral-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-md bg-white border border-neutral-200 text-neutral-800 flex items-center justify-center shadow-xs">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">
                    Carrier: {order.courierName}
                  </h4>
                  <p className="text-xs text-neutral-600">
                    Tracking No: <span className="font-mono font-bold">{order.trackingNumber || "N/A"}</span>
                  </p>
                </div>
              </div>

              {order.trackingUrl && (
                <a
                  href={order.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#111111] text-white font-semibold text-xs shadow-xs hover:bg-black"
                >
                  <span>Track Courier</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}
        </div>

        {/* Ordered Items & Summary */}
        <div className="p-6 rounded-lg bg-white border border-neutral-200 shadow-xs">
          <h3 className="text-sm font-bold text-neutral-900 mb-4">
            Ordered Items ({order.items.length})
          </h3>
          <div className="divide-y divide-neutral-100">
            {order.items.map((item, i) => (
              <div key={i} className="py-3 flex items-center justify-between gap-3">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-14 h-16 rounded-md object-cover border border-neutral-200 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-neutral-900 line-clamp-1">{item.title}</h4>
                  {item.variantName && (
                    <span className="text-[10px] text-neutral-500 block">{item.variantName}</span>
                  )}
                  <span className="text-xs text-neutral-600">Qty: {item.quantity}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold text-neutral-900">
                    ₹{((item.price * item.quantity) / 100).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-neutral-100 text-xs space-y-1.5 text-neutral-600">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-medium text-neutral-900">₹{(order.subtotal / 100).toLocaleString("en-IN")}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount</span>
                <span>-₹{(order.discount / 100).toLocaleString("en-IN")}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span>{order.delivery === 0 ? "FREE" : `₹${order.delivery / 100}`}</span>
            </div>
            {order.codFee > 0 && (
              <div className="flex justify-between">
                <span>COD Handling Fee</span>
                <span>₹{order.codFee / 100}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-neutral-200 font-bold text-sm text-neutral-900">
              <span>Grand Total</span>
              <span>₹{(order.total / 100).toLocaleString("en-IN")}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address & Seller Support */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-lg bg-white border border-neutral-200 shadow-xs">
            <div className="flex items-center gap-2 mb-2 text-xs font-bold text-neutral-900">
              <MapPin className="w-4 h-4 text-neutral-700" />
              <span>Shipping Address</span>
            </div>
            <p className="text-xs font-semibold text-neutral-800">{order.customer.name}</p>
            <p className="text-xs text-neutral-600 mt-0.5">{order.address.street}</p>
            <p className="text-xs text-neutral-600">
              {order.address.city}, {order.address.state} - {order.address.pincode}
            </p>
            <p className="text-xs text-neutral-500 mt-1">Phone: {order.customer.phone}</p>
          </div>

          <div className="p-5 rounded-lg bg-white border border-neutral-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-bold text-neutral-900">
                <ShieldCheck className="w-4 h-4 text-neutral-700" />
                <span>Store Concierge</span>
              </div>
              <h5 className="text-xs font-bold text-neutral-800">{store.name}</h5>
              <p className="text-xs text-neutral-500 mt-0.5">UPI ID: {store.upiId}</p>
            </div>

            <div className="mt-4">
              <a
                href={`https://wa.me/${store.contactPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                  `Hi ${store.name}, I am tracking order ${order.number} (Token: ${order.token})`
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                <Button size="sm" className="w-full bg-[#111111] text-white hover:bg-black rounded-md text-xs gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span>WhatsApp Concierge</span>
                </Button>
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
