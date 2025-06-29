'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Upload, X } from 'lucide-react';

const UploadPrescriptionModal = ({ open, onClose, type, items, orderId, fetchOrders, orderLabel }) => {
  const [file, setFile] = useState(null);
  const [contact, setContact] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);
  const [crossService, setCrossService] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && ['application/pdf', 'image/jpeg', 'image/png'].includes(selectedFile.type)) {
      setFile(selectedFile);
    } else {
      toast.error('Please upload a PDF, JPG, or PNG file', { duration: 4000 });
    }
  };

  const handleItemToggle = (itemId) => {
    setSelectedItems((prev) =>
      prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]
    );
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file to upload', { duration: 4000 });
      return;
    }
    if (!contact) {
      toast.error('Please provide an email or phone number', { duration: 4000 });
      return;
    }
    if (!selectedItems.length && !crossService) {
      toast.error('Please select at least one item or enable cross-service upload', { duration: 4000 });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('prescriptionFile', file);
      formData.append('contact', contact);
      formData.append('orderId', orderId);
      formData.append('itemIds', JSON.stringify(selectedItems));
      formData.append('type', type);
      formData.append('crossService', crossService.toString());

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/prescriptions/upload`, {
        method: 'POST',
        headers: { 'x-guest-id': getGuestId() },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to upload prescription');
      }

      await fetchOrders();
      toast.success('Prescription uploaded successfully. You will be notified within 1-2 hours.', { duration: 4000 });
      onClose();
    } catch (error) {
      toast.error(`Upload failed: ${error.message}`, { duration: 4000 });
    } finally {
      setUploading(false);
    }
  };

  const getGuestId = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('guestId') || require('uuid').v4();
    }
    return '';
  };

  const filteredItems = items.filter((item) => item.service.prescriptionRequired);
  const hasOtherServiceType = items.some((item) => item.service.type !== type);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white/95 rounded-2xl border-[#1ABA7F]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#225F91]">
            Upload {type === 'medication' ? 'Prescription' : 'Lab Request'} for {orderLabel}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <Label htmlFor="file-upload" className="text-[#225F91] font-medium">Upload File</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50"
              aria-label={`Upload ${type === 'medication' ? 'prescription' : 'lab request'} file for ${orderLabel}`}
            />
          </div>
          <div>
            <Label htmlFor="contact" className="text-[#225F91] font-medium">Email or Phone Number</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Enter email or phone"
              className="border-[#1ABA7F]/20 focus:border-[#1ABA7F]/50"
              aria-label={`Contact for notification for ${orderLabel}`}
            />
          </div>
          {filteredItems.length > 0 && (
            <div>
              <Label className="text-[#225F91] font-medium">Select Items</Label>
              <div className="space-y-2 mt-2">
                {filteredItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleItemToggle(item.id)}
                      aria-label={`Select ${item.service.displayName || item.service.name} for ${orderLabel}`}
                    />
                    <Label htmlFor={`item-${item.id}`} className="text-gray-600">
                      {item.service.displayName || item.service.name}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasOtherServiceType && (
            <div className="flex items-center gap-2">
              <Checkbox
                id="cross-service"
                checked={crossService}
                onCheckedChange={setCrossService}
                aria-label={`Apply prescription to both medications and diagnostics for ${orderLabel}`}
              />
              <Label htmlFor="cross-service" className="text-[#225F91] font-medium">
                Apply to both Medications and Diagnostics
              </Label>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-[#1ABA7F]/20 text-[#225F91] hover:bg-[#1ABA7F]/10"
            aria-label={`Cancel upload for ${orderLabel}`}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={uploading}
            className="bg-[#1ABA7F] text-white hover:bg-[#17A076] hover:shadow-[0_0_10px_rgba(26,186,127,0.3)] rounded-full"
            aria-label={`Submit ${type === 'medication' ? 'prescription' : 'lab request'} for ${orderLabel}`}
          >
            {uploading ? <Upload className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadPrescriptionModal;