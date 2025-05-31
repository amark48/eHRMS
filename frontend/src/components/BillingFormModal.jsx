// src/components/BillingFormModal.jsx
import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from "@chakra-ui/react";

const BillingFormModal = ({ isOpen, onClose, mode, initialData, onSubmit }) => {
  // Local state for billing fields.
  const [companyName, setCompanyName] = useState("");
  const [billingStreet, setBillingStreet] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingState, setBillingState] = useState("");
  const [billingZip, setBillingZip] = useState("");
  const [billingCountry, setBillingCountry] = useState("");
  const [billingPhone, setBillingPhone] = useState("");

  // Reset or update form fields when modal opens or when initial data changes.
  useEffect(() => {
    if (initialData) {
      setCompanyName(initialData.companyName || "");
      setBillingStreet(initialData.billingStreet || "");
      setBillingCity(initialData.billingCity || "");
      setBillingState(initialData.billingState || "");
      setBillingZip(initialData.billingZip || "");
      setBillingCountry(initialData.billingCountry || "");
      setBillingPhone(initialData.billingPhone || "");
    } else {
      // Reset fields for add mode.
      setCompanyName("");
      setBillingStreet("");
      setBillingCity("");
      setBillingState("");
      setBillingZip("");
      setBillingCountry("");
      setBillingPhone("");
    }
  }, [initialData, isOpen]);

  // Form submission handler.
  const handleSubmit = (e) => {
    e.preventDefault();
    const billingData = {
      companyName,
      billingStreet,
      billingCity,
      billingState,
      billingZip,
      billingCountry,
      billingPhone,
    };
    onSubmit(billingData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>
          {mode === "edit" ? "Edit Billing Info" : "Add Billing Info"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl id="companyName" isRequired>
              <FormLabel>Company Name</FormLabel>
              <Input
                type="text"
                placeholder="Enter company name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </FormControl>
            <FormControl id="billingStreet" isRequired>
              <FormLabel>Street</FormLabel>
              <Input
                type="text"
                placeholder="Enter street address"
                value={billingStreet}
                onChange={(e) => setBillingStreet(e.target.value)}
              />
            </FormControl>
            <FormControl id="billingCity" isRequired>
              <FormLabel>City</FormLabel>
              <Input
                type="text"
                placeholder="Enter city"
                value={billingCity}
                onChange={(e) => setBillingCity(e.target.value)}
              />
            </FormControl>
            <FormControl id="billingState" isRequired>
              <FormLabel>State</FormLabel>
              <Input
                type="text"
                placeholder="Enter state"
                value={billingState}
                onChange={(e) => setBillingState(e.target.value)}
              />
            </FormControl>
            <FormControl id="billingZip" isRequired>
              <FormLabel>Zip Code</FormLabel>
              <Input
                type="text"
                placeholder="Enter zip code"
                value={billingZip}
                onChange={(e) => setBillingZip(e.target.value)}
              />
            </FormControl>
            <FormControl id="billingCountry" isRequired>
              <FormLabel>Country</FormLabel>
              <Input
                type="text"
                placeholder="Enter country"
                value={billingCountry}
                onChange={(e) => setBillingCountry(e.target.value)}
              />
            </FormControl>
            <FormControl id="billingPhone" isRequired>
              <FormLabel>Phone</FormLabel>
              <Input
                type="text"
                placeholder="Enter phone number"
                value={billingPhone}
                onChange={(e) => setBillingPhone(e.target.value)}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button colorScheme="blue" type="submit">
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default BillingFormModal;