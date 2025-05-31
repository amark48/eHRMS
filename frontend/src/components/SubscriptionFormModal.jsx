// src/components/SubscriptionFormModal.jsx
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
  Switch,
} from "@chakra-ui/react";

const SubscriptionFormModal = ({ isOpen, onClose, mode, initialData, onSubmit }) => {
  // Local state for form fields.
  const [planName, setPlanName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [isActive, setIsActive] = useState(true);

  // Update form state when modal opens or when initialData changes.
  useEffect(() => {
    if (initialData) {
      setPlanName(initialData.planName || "");
      setPrice(initialData.price || "");
      setDuration(initialData.duration || "");
      setIsActive(initialData.isActive !== undefined ? initialData.isActive : true);
    } else {
      // Reset the form when adding a new subscription.
      setPlanName("");
      setPrice("");
      setDuration("");
      setIsActive(true);
    }
  }, [initialData, isOpen]);

  // Handle form submission.
  const handleSubmit = (e) => {
    e.preventDefault();
    const subscriptionData = {
      planName,
      price,
      duration,
      isActive,
    };
    onSubmit(subscriptionData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>
          {mode === "edit" ? "Edit Subscription" : "Add Subscription"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl id="planName" isRequired>
              <FormLabel>Plan Name</FormLabel>
              <Input
                type="text"
                placeholder="Enter plan name"
                value={planName}
                onChange={(e) => setPlanName(e.target.value)}
              />
            </FormControl>
            <FormControl id="price" isRequired>
              <FormLabel>Price</FormLabel>
              <Input
                type="number"
                placeholder="Enter price"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
              />
            </FormControl>
            <FormControl id="duration" isRequired>
              <FormLabel>Duration</FormLabel>
              <Input
                type="text"
                placeholder="Enter duration (e.g. Monthly, Annually)"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              />
            </FormControl>
            <FormControl id="isActive" display="flex" alignItems="center">
              <FormLabel mb="0">Active</FormLabel>
              <Switch
                isChecked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
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

export default SubscriptionFormModal;