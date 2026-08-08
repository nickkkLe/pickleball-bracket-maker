import { unstable_rethrow } from "next/navigation";
import { toast } from "sonner";

/** Call inside a client-side catch block wrapping a Server Action.
 * Re-throws Next.js's internal signals (redirect, notFound, etc.) so the
 * framework still handles them, and only toasts genuine errors. */
export function reportActionError(error: unknown) {
  unstable_rethrow(error);
  toast.error(error instanceof Error ? error.message : "Something went wrong");
}
