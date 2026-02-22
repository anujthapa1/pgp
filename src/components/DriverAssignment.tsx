import React from 'react';
import { useStore } from '../context/StoreContext';

interface DriverAssignmentProps {
  orderId: string;
  onClose: () => void;
}

const DriverAssignment: React.FC<DriverAssignmentProps> = ({ orderId, onClose }) => {
  const { drivers, assignDriver } = useStore();

  const handleAssign = (driverId: string) => {
    assignDriver(orderId, driverId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4">Assign Driver</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {drivers.map((driver) => (
            <button
              key={driver.id}
              onClick={() => handleAssign(driver.id)}
              className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition"
            >
              <span className="font-medium text-gray-900">{driver.name}</span>
              <span className="text-xs text-gray-500 uppercase">{driver.status}</span>
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default DriverAssignment;
