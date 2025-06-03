// BillingFormModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  FormControl,
  FormLabel,
  Input,
  Checkbox,
  Select,
  useToast
} from "@chakra-ui/react";

// Props: isOpen, onClose, mode ("add" | "edit"), initialData (for editing), onSubmit(data)
const BillingFormModal = ({ isOpen, onClose, mode, initialData, onSubmit }) => {
  const toast = useToast();

  // State for the transactional fields
  const [tenantId, setTenantId] = useState("");
  const [billingDate, setBillingDate] = useState("");
  const [amount, setAmount] = useState("");
  const [isPaid, setIsPaid] = useState(false);

  // List tenants for selection
  const [tenants, setTenants] = useState([]);

  // Fetch tenants on component mount
  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const res = await fetch("/api/tenants", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (!res.ok) {
          throw new Error("Failed to fetch tenants");
        }
        const data = await res.json();
        console.log("Fetched tenants:", data);  // Debug log
        setTenants(data);
      } catch (error) {
        console.error("Error fetching tenants:", error);
        toast({
          title: "Error",
          description: error.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    };
    fetchTenants();
  }, [toast]);


  // Populate form fields if editing
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTenantId(initialData.tenantId || "");
      setBillingDate(initialData.billingDate ? initialData.billingDate.substring(0, 10) : ""); 
      // billingDate.substring(0, 10) converts an ISO datetime to 'YYYY-MM-DD'
      setAmount(initialData.amount ? initialData.amount.toString() : "");
      setIsPaid(!!initialData.isPaid);
    } else {
      // Reset the fields for adding.
      setTenantId("");
      setBillingDate("");
      setAmount("");
      setIsPaid(false);
    }
  }, [mode, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation:
    if (!tenantId || !billingDate || !amount) {
      toast({
        title: "Validation error",
        description: "Please fill out all required fields.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Prepare payload for submission.
    const payload = {
      tenantId,
      billingDate, // in YYYY-MM-DD format
      amount,
      isPaid,
    };

    // Call the provided onSubmit handler with the payload.
    onSubmit(payload);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>{mode === "edit" ? "Edit Billing Record" : "Add Billing Record"}</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody pb={6}>
            <FormControl isRequired mb={4}>
              <FormLabel>Tenant</FormLabel>
              <Select
                  placeholder="Select Tenant"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  >
                  <option value="" disabled>Select a Tenant</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </Select>

            </FormControl>
  
            <FormControl isRequired mb={4}>
              <FormLabel>Billing Date</FormLabel>
              <Input
                type="date"
                value={billingDate}
                onChange={(e) => setBillingDate(e.target.value)}
              />
            </FormControl>
  
            <FormControl isRequired mb={4}>
              <FormLabel>Amount ($)</FormLabel>
              <Input
                type="number"
                step="0.01"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </FormControl>
  
            <FormControl mb={4}>
              <FormLabel>Payment Status</FormLabel>
              <Checkbox
                isChecked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
              >
                Paid
              </Checkbox>
            </FormControl>
          </ModalBody>
  
          <ModalFooter>
            <Button onClick={onClose} mr={3}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit">
              {mode === "edit" ? "Save Changes" : "Add Billing"}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
};

export default BillingFormModal;
