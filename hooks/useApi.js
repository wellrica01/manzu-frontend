import { toast } from "sonner";

export async function apiFetch(url, options = {}) {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      const text = await res.text();
      throw new Error(text || "Request failed");
    }
    return res.json();
  } catch (err) {
    toast.error(err.message || "Something went wrong");
    throw err;
  }
}
