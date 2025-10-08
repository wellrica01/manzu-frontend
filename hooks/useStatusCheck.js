import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchPrescriptionStatus, retrieveSession } from '@/lib/statusApiClient';
import { setGuestId as updateGuestId } from '@/lib/utils';

export function useStatusCheck(currentGuestId) {
  return useMutation({
    mutationFn: async ({ identifier, isDirectFetch }) => {
      let guestIdToUse = currentGuestId;

      // If not a direct fetch (from URL), need to retrieve session first
      if (!isDirectFetch) {
        if (!currentGuestId) {
          throw new Error('No guest ID found. Please try again.');
        }

        const sessionData = await retrieveSession(currentGuestId, identifier);
        const newGuestId = sessionData.guestId;

        if (!newGuestId) {
          throw new Error('Unable to retrieve prescription with that contact information.');
        }

        // Update guest ID if changed
        if (currentGuestId !== newGuestId) {
          updateGuestId(newGuestId);
          guestIdToUse = newGuestId;
        }
      } else {
        guestIdToUse = identifier; // For direct fetch, identifier IS the guestId
      }

      // Fetch prescription status
      const data = await fetchPrescriptionStatus(guestIdToUse);
      const { prescriptionMetadata, medications } = data;

      // Return data with redirect info instead of redirecting immediately
      return {
        ...prescriptionMetadata,
        medications,
        shouldRedirect: prescriptionMetadata.status === 'VERIFIED' && medications?.length > 0,
        redirectUrl: `/prescriptions/${guestIdToUse}?guestId=${guestIdToUse}`,
        guestId: guestIdToUse
      };
    },
    onSuccess: (data) => {
      if (data.shouldRedirect) {
        // Update guest ID but don't redirect - let component handle it
        updateGuestId(data.guestId);
        // Toast will be shown by the component after animation
        return;
      }

      if (['PENDING', 'PENDING_ADMIN', 'PENDING_ACTION'].includes(data.status)) {
        toast.info(
          'Your prescription is under review. You will be notified when it is ready.',
          { duration: 4000 }
        );
      } else {
        toast.info(
          'No medications available for this prescription. Please contact support or start a new order.',
          { duration: 4000 }
        );
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to check status', { duration: 4000 });
    }
  });
}