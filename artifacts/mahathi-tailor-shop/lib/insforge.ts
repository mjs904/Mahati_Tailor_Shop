import {
  createClient,
  type InsForgeClient,
} from "@insforge/sdk";

const insforgeUrl = process.env.NEXT_PUBLIC_INSFORGE_URL?.trim().replace(
  /\/+$/,
  '',
);
const insforgeAnonKey = process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY?.trim();

let insforgeClient: InsForgeClient | undefined;

/**
 * Tables exposed through the app's public InsForge database layer.
 *
 * This is an access map only. CRUD operations should be added alongside the
 * feature that needs them so authorization rules remain easy to audit.
 */
export const INSFORGE_TABLES = {
  profiles: "profiles",
  categories: "categories",
  products: "products",
  wishlist: "wishlist",
  cartItems: "cart_items",
  orders: "orders",
  orderItems: "order_items",
  measurements: "measurements",
  tailoringRequests: "tailoring_requests",
  aariRequests: "aari_requests",
  appointments: "appointments",
  gallery: "gallery",
} as const;

export type InsforgeTableName =
  (typeof INSFORGE_TABLES)[keyof typeof INSFORGE_TABLES];

export type SignUpRequest = Parameters<InsForgeClient["auth"]["signUp"]>[0];
export type PasswordSignInRequest = Parameters<
  InsForgeClient["auth"]["signInWithPassword"]
>[0];
export type VerifyEmailRequest = Parameters<
  InsForgeClient["auth"]["verifyEmail"]
>[0];
export type ResendVerificationEmailRequest = Parameters<
  InsForgeClient["auth"]["resendVerificationEmail"]
>[0];
export type AuthStateChangeCallback = Parameters<
  InsForgeClient["auth"]["onAuthStateChange"]
>[0];
export type InsforgeTableQuery = ReturnType<
  InsForgeClient["database"]["from"]
>;

export interface ProfileRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
}

export function isInsforgeConfigured(): boolean {
  return Boolean(insforgeUrl && insforgeAnonKey);
}

/**
 * Lazily create the browser-safe InsForge client.
 *
 * The SDK's default browser mode sends credentials with auth requests and
 * restores sessions through InsForge's refresh cookie. Keeping creation lazy
 * means the existing static marketplace can still render before environment
 * variables are added or an auth feature calls this layer.
 */
export function getInsforgeClient(): InsForgeClient {
  if (insforgeClient) {
    return insforgeClient;
  }

  if (!insforgeUrl || !insforgeAnonKey) {
    throw new Error(
      "InsForge is not configured. Set NEXT_PUBLIC_INSFORGE_URL and NEXT_PUBLIC_INSFORGE_ANON_KEY.",
    );
  }

  insforgeClient = createClient({
    baseUrl: insforgeUrl,
    anonKey: insforgeAnonKey,
  });

  return insforgeClient;
}

export function getInsforgeDatabase() {
  return getInsforgeClient().database;
}

/**
 * Get a typed PostgREST query builder for one of the app's approved tables.
 */
export function getInsforgeTable(
  tableName: InsforgeTableName,
): InsforgeTableQuery {
  return getInsforgeDatabase().from(tableName);
}

export const insforgeTables = {
  profiles: () => getInsforgeTable(INSFORGE_TABLES.profiles),
  categories: () => getInsforgeTable(INSFORGE_TABLES.categories),
  products: () => getInsforgeTable(INSFORGE_TABLES.products),
  wishlist: () => getInsforgeTable(INSFORGE_TABLES.wishlist),
  cartItems: () => getInsforgeTable(INSFORGE_TABLES.cartItems),
  orders: () => getInsforgeTable(INSFORGE_TABLES.orders),
  orderItems: () => getInsforgeTable(INSFORGE_TABLES.orderItems),
  measurements: () => getInsforgeTable(INSFORGE_TABLES.measurements),
  tailoringRequests: () =>
    getInsforgeTable(INSFORGE_TABLES.tailoringRequests),
  aariRequests: () => getInsforgeTable(INSFORGE_TABLES.aariRequests),
  appointments: () => getInsforgeTable(INSFORGE_TABLES.appointments),
  gallery: () => getInsforgeTable(INSFORGE_TABLES.gallery),
} as const;

export function registerUser(request: SignUpRequest) {
  return getInsforgeClient().auth.signUp(request);
}

export function loginUser(request: PasswordSignInRequest) {
  return getInsforgeClient().auth.signInWithPassword(request);
}

export function verifyUserEmail(request: VerifyEmailRequest) {
  return getInsforgeClient().auth.verifyEmail(request);
}

export function resendUserVerificationEmail(
  request: ResendVerificationEmailRequest,
) {
  return getInsforgeClient().auth.resendVerificationEmail(request);
}

export function logoutUser() {
  return getInsforgeClient().auth.signOut();
}

export function createProfile(profile: ProfileRecord) {
  return getInsforgeTable(INSFORGE_TABLES.profiles).insert(profile);
}

/**
 * Ensures a valid record exists in the 'profiles' table and returns its UUID.
 * If user is authenticated, returns user's existing ID.
 * If guest, creates a guest profile row so foreign keys (orders, appointments,
 * tailoring requests) are properly satisfied in Postgres.
 */
export async function ensureProfileId(details: {
  id?: string | null;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}): Promise<string> {
  if (details.id && details.id !== '00000000-0000-0000-0000-000000000000') {
    return details.id;
  }

  let guestId: string;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    guestId = crypto.randomUUID();
  } else {
    guestId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  try {
    await getInsforgeTable(INSFORGE_TABLES.profiles).insert({
      id: guestId,
      name: details.name?.trim() || 'Boutique Client',
      phone: details.phone?.trim() || '9999999999',
      email: details.email?.trim() || `${guestId.slice(0, 8)}@guest.mahathitailor.in`,
      address: details.address?.trim() || null,
      city: details.city?.trim() || 'Hyderabad',
      state: details.state?.trim() || 'Telangana',
      pincode: details.pincode?.trim() || '500034',
    });
  } catch (err) {
    console.warn('ensureProfileId note:', err);
  }

  return guestId;
}

/**
 * Resolve the current user using the SDK's cookie-backed session refresh.
 * This works both as an authenticated-user check and as the app's session
 * lookup boundary for future auth UI.
 */
export async function getCurrentUser() {
  return getInsforgeClient().auth.getCurrentUser();
}

export async function getCurrentSession() {
  const result = await getCurrentUser();
  const isUnauthenticated =
    result.error?.statusCode === 401 || result.error?.statusCode === 403;

  return {
    ...result,
    data: isUnauthenticated ? { user: null } : result.data,
    error: isUnauthenticated ? null : result.error,
    user: isUnauthenticated ? null : result.data.user,
    isAuthenticated: isUnauthenticated ? false : Boolean(result.data.user),
  };
}

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  return getInsforgeClient().auth.onAuthStateChange(callback);
}

function getInsforgeErrorDetails(error: unknown): string {
  return (
    error && typeof error === "object"
      ? [
          "message" in error ? error.message : "",
          "code" in error ? error.code : "",
          "statusCode" in error ? error.statusCode : "",
        ]
          .filter(Boolean)
          .join(" ")
      : error instanceof Error
        ? error.message
        : String(error ?? "")
  );
}

export function isDuplicateEmailError(error: unknown): boolean {
  const normalized = getInsforgeErrorDetails(error).toLowerCase();
  return (
    normalized.includes("already exists") ||
    normalized.includes("already registered") ||
    normalized.includes("duplicate") ||
    normalized.includes("unique constraint") ||
    normalized.includes("user_exists") ||
    normalized.includes("email_exists") ||
    normalized.includes("409")
  );
}

export function isEmailVerificationRequired(error: unknown): boolean {
  const normalized = getInsforgeErrorDetails(error).toLowerCase();
  return (
    normalized.includes("not verified") ||
    normalized.includes("email_not_verified") ||
    normalized.includes("verification required") ||
    normalized.includes("verify your email")
  );
}

export function getInsforgeErrorMessage(
  error: unknown,
  fallback: string,
): string {
  const details = getInsforgeErrorDetails(error);
  const normalized = details.toLowerCase();

  if (
    normalized.includes("not configured") ||
    normalized.includes("next_public_insforge")
  ) {
    return "InsForge is not configured for this app. Please add the required environment variables.";
  }
  if (
    normalized.includes("otp") ||
    normalized.includes("verification code") ||
    normalized.includes("expired")
  ) {
    return "That verification code is invalid or expired. Request a new code and try again.";
  }
  if (
    normalized.includes("invalid credential") ||
    normalized.includes("invalid email") ||
    normalized.includes("invalid password") ||
    normalized.includes("unauthorized") ||
    normalized.includes("401") ||
    normalized.includes("invalid_credentials")
  ) {
    return "The email or password is incorrect.";
  }
  if (isDuplicateEmailError(error)) {
    return "An account with this email already exists. Try logging in instead.";
  }
  if (isEmailVerificationRequired(error)) {
    return "Please verify your email before logging in.";
  }
  if (
    normalized.includes("network") ||
    normalized.includes("failed to fetch") ||
    normalized.includes("fetch failed") ||
    normalized.includes("timeout") ||
    normalized.includes("econn") ||
    normalized.includes("503")
  ) {
    return "We couldn't reach Mahathi right now. Check your connection and try again.";
  }

  return fallback;
}