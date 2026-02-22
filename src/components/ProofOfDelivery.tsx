import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Camera, X, Check } from 'lucide-react';
import { ProofOfDelivery as PODType } from '../types';
import { motion } from 'framer-motion';

interface ProofOfDeliveryProps {
  onSave: (pod: PODType) => void;
  onCancel: () => void;
}

const ProofOfDelivery: React.FC<ProofOfDeliveryProps> = ({ onSave, onCancel }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const clear = () => {
    sigCanvas.current?.clear();
    setError('');
  };

  const handleSave = () => {
    let signature = undefined;
    try {
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        signature = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      }
    } catch (e) {
      console.error('Failed to capture signature', e);
    }

    if (!photo || !signature) {
      setError('POD requires exactly one photo and one signature before completion.');
      return;
    }

    setError('');

    onSave({
      signature,
      photo,
      timestamp: new Date().toISOString(),
      notes: notes || undefined,
    });
  };

  const simulatePhoto = () => {
    setPhoto('https://images.unsplash.com/photo-1586769852836-bc069f19e1b6?auto=format&fit=crop&q=80&w=200&h=200');
    setError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gray-900 bg-opacity-75 flex flex-col z-50 overflow-y-auto"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="bg-white min-h-screen sm:min-h-0 sm:max-w-lg sm:mx-auto sm:my-8 sm:rounded-2xl flex flex-col shadow-2xl"
      >
        <div className="flex justify-between items-center p-5 border-b sticky top-0 bg-white sm:rounded-t-2xl z-10">
          <h2 className="text-xl font-bold">Proof of Delivery</h2>
          <button onClick={onCancel} className="p-2 text-gray-400 hover:text-gray-600"><X /></button>
        </div>

        <div className="p-5 space-y-6 flex-1">
          {/* Photo Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-tight">Delivery Photo</label>
            {photo ? (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative inline-block w-full"
              >
                <img src={photo} alt="POD" className="w-full h-56 object-cover rounded-xl shadow-md" />
                <button
                  onClick={() => {
                    setPhoto(null);
                    setError('');
                  }}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-lg"
                >
                  <X className="h-4 w-4" />
                </button>
              </motion.div>
            ) : (
              <button
                onClick={simulatePhoto}
                className="w-full h-56 border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center text-gray-400 hover:text-primary-500 hover:border-primary-500 hover:bg-primary-50/30 transition-all group"
              >
                <div className="bg-gray-50 p-4 rounded-full group-hover:bg-primary-100 transition-colors">
                  <Camera className="h-8 w-8 mb-0" />
                </div>
                <span className="mt-2 font-medium">Take a Delivery Photo</span>
              </button>
            )}
          </div>

          {/* Signature Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-tight">Customer Signature</label>
            <div className="border-2 border-gray-100 rounded-2xl bg-gray-50/50 overflow-hidden">
              <SignatureCanvas
                ref={sigCanvas}
                penColor="black"
                canvasProps={{ className: 'w-full h-44' }}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={clear}
                className="text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Clear and redo
              </button>
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-700 uppercase tracking-tight">Delivery Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. Left at front door, handed to resident..."
              className="w-full border-2 border-gray-100 rounded-2xl p-4 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm font-bold text-red-500">{error}</p>
          )}
        </div>

        <div className="p-5 border-t bg-gray-50/80 sm:rounded-b-2xl sticky bottom-0">
          <button
            onClick={handleSave}
            className="w-full bg-primary-600 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center shadow-lg shadow-primary-200 hover:bg-primary-700 active:scale-[0.98] transition-all"
          >
            <Check className="mr-2 h-6 w-6" /> Complete Delivery
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProofOfDelivery;
