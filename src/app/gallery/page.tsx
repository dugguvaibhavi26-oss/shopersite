"use client";

import * as React from "react";
import {
  Button,
  Input,
  PhoneInput,
  PinCodeInput,
  PriceInput,
  SearchInput,
  Select,
  Combobox,
  Checkbox,
  Radio,
  Toggle,
  Tabs,
  Badge,
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  ResponsiveTable,
  EmptyState,
  Skeleton,
  ProductCardSkeleton,
  Stepper,
  ProgressBar,
  ImageUploader,
  ColorPicker,
  ReorderList,
  DateRangePicker,
  ShareCard,
  Modal,
  Toast,
  Tooltip,
} from "@/components/ui";
import { siteConfig } from "@/lib/config/site";
import { ShoppingBag, Eye, Smartphone, Monitor, Sparkles, CheckCircle2 } from "lucide-react";

export default function ComponentGalleryPage() {
  // Interactive States
  const [activeTab, setActiveTab] = React.useState("all");
  const [toggleVal, setToggleVal] = React.useState(true);
  const [checkboxVal, setCheckboxVal] = React.useState(true);
  const [radioVal, setRadioVal] = React.useState("starter");
  const [currentStep, setCurrentStep] = React.useState(3);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [modalVariant, setModalVariant] = React.useState<"dialog" | "sheet">("dialog");
  const [showToast, setShowToast] = React.useState(true);
  const [isMobilePreview, setIsMobilePreview] = React.useState(false);

  // Sample data for Table
  const tableData = [
    { id: "1001", customer: "Pooja Sharma", phone: "+91 98765 11111", total: "₹1,499", status: "Paid", items: "2 items" },
    { id: "1002", customer: "Rahul Verma", phone: "+91 98765 22222", total: "₹799", status: "COD Pending", items: "1 item" },
    { id: "1003", customer: "Ananya Rao", phone: "+91 98765 33333", total: "₹2,850", status: "Shipped", items: "3 items" },
  ];

  // Sample data for Reorder List
  const [reorderItems, setReorderItems] = React.useState<import("@/components/ui").ReorderItem[]>([
    { id: "s1", title: "Hero Banner", subtitle: "Diwali collection showcase" },
    { id: "s2", title: "Best Sellers Grid", subtitle: "8 featured items" },
    { id: "s3", title: "Customer Testimonials", subtitle: "3 verified reviews" },
  ]);

  return (
    <div className="home-sans min-h-screen bg-white text-neutral-950 py-8 px-4 sm:px-8 font-[Inter,sans-serif]">
      {/* Top Header */}
      <div className="max-w-6xl mx-auto mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              S
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">
              {siteConfig.name} Design System & Component Gallery
            </h1>
            <Badge variant="success" size="sm">
              M1 Complete
            </Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Mobile-first accessible component library (WCAG 2.2 AA compliant, 44px touch targets).
          </p>
        </div>

        {/* Viewport switch: Standard vs 360px Mobile Simulation */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-[#CBD5E1] shadow-2xs self-start sm:self-auto">
          <Button
            size="sm"
            variant={!isMobilePreview ? "primary" : "ghost"}
            onClick={() => setIsMobilePreview(false)}
            className="h-8 px-3 text-xs"
          >
            <Monitor className="w-3.5 h-3.5 mr-1" />
            <span>Responsive</span>
          </Button>
          <Button
            size="sm"
            variant={isMobilePreview ? "primary" : "ghost"}
            onClick={() => setIsMobilePreview(true)}
            className="h-8 px-3 text-xs"
          >
            <Smartphone className="w-3.5 h-3.5 mr-1" />
            <span>360px Phone</span>
          </Button>
        </div>
      </div>

      {/* Main Container: can simulate 360px width */}
      <div
        className={isMobilePreview ? "max-w-[360px] mx-auto border-4 border-[#0F172A] rounded-xl p-4 bg-white shadow-2xl overflow-hidden transition-all duration-300" : "max-w-6xl mx-auto space-y-12"}
      >
        {/* Navigation Tabs */}
        <div className="mb-6">
          <Tabs
            tabs={[
              { id: "all", label: "All Components" },
              { id: "forms", label: "Inputs & Forms" },
              { id: "actions", label: "Buttons & Badges" },
              { id: "layout", label: "Layout & Data" },
            ]}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {/* SECTION 1: Buttons */}
        {(activeTab === "all" || activeTab === "actions") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span>1. Buttons</span>
              <span className="text-xs font-normal text-[#64748B]">(All states & 44px mobile touch targets)</span>
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-6 rounded-lg border border-[#E2E8F0]">
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Primary</span>
                <Button variant="primary">Publish Store</Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Secondary</span>
                <Button variant="secondary">Save Draft</Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Outline</span>
                <Button variant="outline">Preview Theme</Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Destructive</span>
                <Button variant="destructive">Delete Item</Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Loading State</span>
                <Button isLoading loadingText="Saving...">
                  Save
                </Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Disabled</span>
                <Button disabled>Disabled</Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Small</span>
                <Button size="sm">Small (36px)</Button>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs text-[#64748B]">Large</span>
                <Button size="lg">Large (48px)</Button>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 2: Specialized Indian Seller Inputs */}
        {(activeTab === "all" || activeTab === "forms") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A] flex items-center gap-2">
              <span>2. Specialized Inputs</span>
              <span className="text-xs font-normal text-[#64748B]">(Phone +91, PIN code auto-city, Rupee ₹ price)</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-6 rounded-lg border border-[#E2E8F0]">
              <PhoneInput label="Indian Mobile Number" helperText="Sellers receive OTP on this number" />
              <PriceInput label="Product Selling Price" placeholder="999" helperText="Stored as 99900 paise" />
              <PinCodeInput
                label="Postal PIN Code"
                helperText="Auto-fills city and state"
                onLookupComplete={(loc) => alert(`PIN code resolved: ${loc.city}, ${loc.state}`)}
              />
              <SearchInput placeholder="Search catalog..." />
              <Input
                label="Store Subdomain"
                placeholder="mybrand"
                rightAddon={<span className="text-xs font-mono text-[#64748B]">.{siteConfig.domain}</span>}
              />
              <Input
                label="Error State Input"
                defaultValue="invalid-subdomain-!"
                error="Only lowercase letters and numbers are allowed"
              />
            </div>
          </section>
        )}

        {/* SECTION 3: Select, Combobox & Selection Controls */}
        {(activeTab === "all" || activeTab === "forms") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">3. Dropdowns & Selection Controls</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-[#E2E8F0]">
              <div className="space-y-4">
                <Select
                  label="Business Category"
                  options={[
                    { label: "Women's Fashion & Boutiques", value: "fashion" },
                    { label: "Jewellery & Accessories", value: "jewellery" },
                    { label: "Beauty & Skincare", value: "beauty" },
                    { label: "Bakery & Food", value: "food" },
                    { label: "Handmade Crafts", value: "crafts" },
                  ]}
                />
                <Combobox
                  label="Searchable Theme Preset"
                  options={[
                    { label: "Bloom (Boutiques & Fashion)", value: "bloom" },
                    { label: "Zest (Streetwear & Gen-Z)", value: "zest" },
                    { label: "Fresh (Food & Bakery)", value: "fresh" },
                    { label: "Mono (Minimal Black & White)", value: "mono" },
                    { label: "Noir (Luxury & Jewellery)", value: "noir" },
                  ]}
                  value="bloom"
                />
              </div>

              <div className="space-y-3">
                <Checkbox
                  label="Enable Cash on Delivery (COD)"
                  description="Collect cash directly from buyer upon delivery"
                  checked={checkboxVal}
                  onChange={(e) => setCheckboxVal(e.target.checked)}
                />
                <Toggle
                  label="Pause Store Temporarily"
                  description="Buyers will see a friendly 'We are taking a break' notice"
                  checked={toggleVal}
                  onChange={setToggleVal}
                />
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <span className="text-xs font-semibold text-[#0F172A] block mb-1">Billing Plan Selection</span>
                  <div className="grid grid-cols-2 gap-2">
                    <Radio
                      name="plan"
                      label="Free (₹0/mo)"
                      checked={radioVal === "free"}
                      onChange={() => setRadioVal("free")}
                    />
                    <Radio
                      name="plan"
                      label="Starter (₹299/mo)"
                      checked={radioVal === "starter"}
                      onChange={() => setRadioVal("starter")}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 4: Badges & Status Pills */}
        {(activeTab === "all" || activeTab === "actions") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">4. Badges & Status Indicators</h2>
            <div className="flex flex-wrap gap-2.5 bg-white p-6 rounded-lg border border-[#E2E8F0]">
              <Badge variant="success">Paid (₹799)</Badge>
              <Badge variant="warning">Awaiting UPI Check</Badge>
              <Badge variant="error">Out of Stock</Badge>
              <Badge variant="info">Shipped with DTDC</Badge>
              <Badge variant="primary">Published</Badge>
              <Badge variant="neutral">Draft Post</Badge>
            </div>
          </section>
        )}

        {/* SECTION 5: Responsive Table with Mobile Card Collapse */}
        {(activeTab === "all" || activeTab === "layout") && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#0F172A]">5. Responsive Table</h2>
                <p className="text-xs text-[#64748B]">
                  Renders standard table on desktop; automatically collapses into touch cards on screens &lt; 640px.
                </p>
              </div>
            </div>
            <ResponsiveTable
              columns={[
                { key: "id", header: "Order #" },
                { key: "customer", header: "Customer" },
                { key: "items", header: "Items" },
                { key: "total", header: "Total" },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <Badge variant={row.status === "Paid" ? "success" : "warning"} size="sm">
                      {row.status}
                    </Badge>
                  ),
                },
              ]}
              data={tableData}
              keyExtractor={(row) => row.id}
            />
          </section>
        )}

        {/* SECTION 6: Stepper & Progress */}
        {(activeTab === "all" || activeTab === "layout") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">6. Stepper & Progress Tracker</h2>
            <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] space-y-6">
              <Stepper
                currentStep={currentStep}
                steps={[
                  { id: 1, title: "Basics" },
                  { id: 2, title: "Contact" },
                  { id: 3, title: "Products" },
                  { id: 4, title: "Theme" },
                  { id: 5, title: "Payments" },
                  { id: 6, title: "Publish" },
                ]}
              />
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => setCurrentStep((s) => Math.max(1, s - 1))}>
                  Previous Step
                </Button>
                <Button size="sm" onClick={() => setCurrentStep((s) => Math.min(6, s + 1))}>
                  Next Step ({currentStep}/6)
                </Button>
              </div>
              <ProgressBar value={currentStep} max={6} label="Onboarding Completion" />
            </div>
          </section>
        )}

        {/* SECTION 7: Image Uploader & Color Picker with Live Contrast */}
        {(activeTab === "all" || activeTab === "forms") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">7. Image Uploader & WCAG Contrast Color Picker</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 rounded-lg border border-[#E2E8F0]">
              <ImageUploader label="Product Photo" aspectRatio="1:1" />
              <ColorPicker label="Theme Primary Color" value="#1E3A8A" />
            </div>
          </section>
        )}

        {/* SECTION 8: Drag/Up-Down Reorder List & Share Card */}
        {(activeTab === "all" || activeTab === "layout") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">8. Reorderable Sections & Share Card with QR</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] flex flex-col gap-3">
                <h3 className="text-sm font-bold text-[#0F172A]">Home Page Section Order</h3>
                <p className="text-xs text-[#64748B]">Move sections up or down with touch buttons</p>
                <ReorderList items={reorderItems} onChange={setReorderItems} />
              </div>
              <div>
                <ShareCard storeName="Aura Boutique" storeUrl={`https://aura.${siteConfig.domain}`} />
              </div>
            </div>
          </section>
        )}

        {/* SECTION 9: Empty States & Skeletons */}
        {(activeTab === "all" || activeTab === "layout") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">9. Empty & Loading States</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded-lg border border-[#E2E8F0]">
                <EmptyState
                  title="No orders yet"
                  description="Share your store link on your Instagram bio and WhatsApp stories to receive your first order."
                  action={{
                    label: "Share Store Link",
                    onClick: () => alert("Open Share Link"),
                  }}
                />
              </div>
              <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] space-y-4">
                <span className="text-xs font-semibold text-[#0F172A]">Skeleton Placeholders</span>
                <div className="grid grid-cols-2 gap-3">
                  <ProductCardSkeleton />
                  <ProductCardSkeleton />
                </div>
              </div>
            </div>
          </section>
        )}

        {/* SECTION 10: Modals & Toast Triggers */}
        {(activeTab === "all" || activeTab === "actions") && (
          <section className="space-y-4">
            <h2 className="text-lg font-bold text-[#0F172A]">10. Modals (Bottom Sheet / Dialog) & Toasts</h2>
            <div className="bg-white p-6 rounded-lg border border-[#E2E8F0] flex flex-wrap gap-4 items-center">
              <Button
                variant="secondary"
                onClick={() => {
                  setModalVariant("dialog");
                  setIsModalOpen(true);
                }}
              >
                Open Centered Dialog
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setModalVariant("sheet");
                  setIsModalOpen(true);
                }}
              >
                Open Mobile Bottom Sheet
              </Button>
              <Tooltip content="WCAG AA verified: 11.2:1 contrast ratio">
                <Button variant="outline">Hover for Tooltip</Button>
              </Tooltip>
            </div>
          </section>
        )}

        {/* Demo Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          variant={modalVariant}
          title={modalVariant === "sheet" ? "Quick Action Sheet" : "Publish Store Confirmation"}
          description="A new online storefront will be instantly accessible to your customers."
        >
          <div className="space-y-4 text-left">
            <p className="text-sm text-[#0F172A]">
              Your store will be live at:{" "}
              <strong className="text-[#1E3A8A]">auraboutique.{siteConfig.domain}</strong>
            </p>
            <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-xs text-[#64748B]">
              Direct UPI and COD payments are pre-configured. You can modify them anytime in Settings.
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setIsModalOpen(false);
                  setShowToast(true);
                }}
              >
                Confirm & Publish
              </Button>
            </div>
          </div>
        </Modal>

        {/* Demo Toast in bottom corner */}
        {showToast && (
          <div className="fixed bottom-4 right-4 z-50">
            <Toast
              type="success"
              title="Store Published Successfully"
              message={`Your store is now live at auraboutique.${siteConfig.domain}`}
              onClose={() => setShowToast(false)}
              action={{
                label: "Copy Link",
                onClick: () => {
                  navigator.clipboard?.writeText(`https://auraboutique.${siteConfig.domain}`);
                  alert("Copied!");
                },
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
