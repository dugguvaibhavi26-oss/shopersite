"use client";

/**
 * The app's identity icons: Phosphor, "fill" weight (solid, rounded). Used for navigation, page
 * headers, stat cards and empty states. Small action icons (close, arrows, chevrons) stay as light
 * line icons from lucide-react.
 *
 * Each export takes the same props as before (className etc.) and is always filled.
 */
import * as React from "react";
import {
  ArrowsClockwise,
  Bell,
  ChartLineUp,
  ChartPieSlice,
  ChatCircleDots,
  ChatTeardropText,
  CheckCircle,
  Clock,
  CreditCard,
  Crown,
  CurrencyInr,
  EnvelopeSimple,
  Eye,
  Gear,
  Globe,
  Handbag,
  House,
  Image as PhImage,
  LockSimple,
  MapPin,
  At,
  Package,
  PaintRoller,
  Percent,
  Plug,
  Pulse,
  Scales,
  SealCheck,
  ShoppingCart,
  Sparkle,
  Stack,
  StackSimple,
  Star,
  Storefront,
  Tag,
  Truck,
  User,
  Users,
  Warning,
  XCircle,
  type IconProps,
} from "@phosphor-icons/react";

type P = Omit<IconProps, "weight"> & { className?: string };
const filled = (Icon: React.ComponentType<IconProps>, name: string) => {
  const C = (props: P) => <Icon weight="fill" {...props} />;
  C.displayName = name;
  return C;
};

// navigation (matches the menu: Home, Orders, Products, Categories, Customers, Reviews, Discounts, Themes, Plugins, Settings, Notifications)
export const IHome = filled(House, "IHome");
export const IOrders = filled(Handbag, "IOrders");
export const IProducts = filled(Package, "IProducts");
export const ICategories = filled(Stack, "ICategories");
export const ICustomers = filled(Users, "ICustomers");
export const IReviews = filled(Sparkle, "IReviews");
export const IDiscounts = filled(Tag, "IDiscounts");
export const IThemes = filled(PaintRoller, "IThemes");
export const IPlugins = filled(Plug, "IPlugins");
export const ISettings = filled(Gear, "ISettings");
export const INotifications = filled(Bell, "INotifications");
export const IProfile = filled(User, "IProfile");
export const IAnalytics = filled(ChartPieSlice, "IAnalytics");

// stats, settings sections and cards
export const IRupee = filled(CurrencyInr, "IRupee");
export const IRepeat = filled(ArrowsClockwise, "IRepeat");
export const IStar = filled(Star, "IStar");
export const ITrend = filled(ChartLineUp, "ITrend");
export const ISparkle = filled(Sparkle, "ISparkle");
export const IPercent = filled(Percent, "IPercent");
export const ITruck = filled(Truck, "ITruck");
export const ICard = filled(CreditCard, "ICard");
export const ICollections = filled(StackSimple, "ICollections");
export const ICheck = filled(CheckCircle, "ICheck");
export const IWarning = filled(Warning, "IWarning");
export const ISoldOut = filled(XCircle, "ISoldOut");
export const IQuote = filled(ChatTeardropText, "IQuote");
export const IVerified = filled(SealCheck, "IVerified");
export const IClock = filled(Clock, "IClock");
export const IStore = filled(Storefront, "IStore");
export const IImage = filled(PhImage, "IImage");
export const IGlobe = filled(Globe, "IGlobe");
export const ICart = filled(ShoppingCart, "ICart");
export const IActivity = filled(Pulse, "IActivity");
export const ILock = filled(LockSimple, "ILock");
export const IPolicies = filled(Scales, "IPolicies");
export const IMail = filled(EnvelopeSimple, "IMail");
export const IChat = filled(ChatCircleDots, "IChat");
export const IEye = filled(Eye, "IEye");
export const ICrown = filled(Crown, "ICrown");
export const IPin = filled(MapPin, "IPin");
export const IAt = filled(At, "IAt");
