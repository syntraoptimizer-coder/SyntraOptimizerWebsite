// Email OTP length is configurable in Supabase (6–10 digits); authenticator codes use 6.
// Keep the full pasted value so an incomplete prefix is never silently submitted.
export const normalizeOtp = (value: string) => value.replace(/[\s-]/g, "");
export const isEmailOtp = (value: string) => /^\d{6,10}$/.test(value);
export const isTotp = (value: string) => /^\d{6}$/.test(value);

export function emailOtpError(error: { code?: string; status?: number; message?: string }): string {
  if (error.status === 429) return "Too many attempts. Please wait a minute before trying again.";
  if (error.code === "otp_expired") {
    return "This code is invalid, expired, or already used. Enter the full code from the latest email, or request a new one.";
  }
  return error.message || "We couldn't verify your code. Please try again.";
}
