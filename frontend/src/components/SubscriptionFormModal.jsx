// src/components/SubscriptionFormModal.jsx

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
  Select,
  Switch,
  VStack,
  Textarea,
  useToast,
} from "@chakra-ui/react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const SubscriptionFormModal = ({ isOpen, onClose, subscription, onSubmit }) => {
  const toast = useToast();

  // Form fields for the updated Subscription model.
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("monthly");
  const [features, setFeatures] = useState("");
  const [trialPeriodDays, setTrialPeriodDays] = useState("");
  const [status, setStatus] = useState("active");
  const [autoRenew, setAutoRenew] = useState(true);
  const [renewalDate, setRenewalDate] = useState("");

  // Initialize form fields from subscription (edit mode) or clear for add mode.
  useEffect(() => {
    if (subscription) {
      console.log(
        "[DEBUG] Initializing SubscriptionFormModal in edit mode with data:",
        subscription
      );
      setName(subscription.name || "");
      setPrice(subscription.price || "");
      setDuration(subscription.duration || "monthly");
      setFeatures(
        subscription.features ? JSON.stringify(subscription.features, null, 2) : ""
      );
      setTrialPeriodDays(subscription.trialPeriodDays || "");
      setStatus(subscription.status || "active");
      setAutoRenew(
        typeof subscription.autoRenew !== "undefined" ? subscription.autoRenew : true
      );
      if (subscription.renewalDate) {
        const dateObj = new Date(subscription.renewalDate);
        const yyyy = dateObj.getFullYear();
        let mm = dateObj.getMonth() + 1;
        let dd = dateObj.getDate();
        if (mm < 10) mm = "0" + mm;
        if (dd < 10) dd = "0" + dd;
        setRenewalDate(`${yyyy}-${mm}-${dd}`);
      } else {
        setRenewalDate("");
      }
    } else {
      console.log("[DEBUG] Initializing SubscriptionFormModal in add mode.");
      // Clear all fields.
      setName("");
      setPrice("");
      setDuration("monthly");
      setFeatures("");
      setTrialPeriodDays("");
      setStatus("active");
      setAutoRenew(true);
      setRenewalDate("");
    }
  }, [subscription]);

  // Handle form submission: validate, build payload, send API request.
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[DEBUG] Submitting SubscriptionFormModal with values:", {
      name,
      price,
      duration,
      features,
      trialPeriodDays,
      status,
      autoRenew,
      renewalDate,
    });

    // Basic field validation
    if (!name || !price || !duration) {
      toast({
        title: "Required fields missing",
        description:
          "Please fill out Subscription Name, Price, and Duration.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Parse the Features field (if provided).
    let parsedFeatures = null;
    if (features.trim() !== "") {
      try {
        parsedFeatures = JSON.parse(features);
      } catch (err) {
        toast({
          title: "Invalid Features JSON",
          description: "Please ensure the Features field contains valid JSON.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        return;
      }
    }

    // Build the payload.
    const subscriptionData = {
      name,
      price, // If needed, conversion to a number can be done on the server.
      duration,
      features: parsedFeatures,
      trialPeriodDays: trialPeriodDays !== "" ? Number(trialPeriodDays) : null,
      status,
      autoRenew,
      renewalDate: renewalDate !== "" ? renewalDate : null,
    };

    console.log("[DEBUG] Final subscription payload to be sent:", subscriptionData);

    try {
      const token = localStorage.getItem("authToken");
      let url = "";
      let method = "";
      if (subscription) {
        // Edit mode: update existing subscription.
        url = `${API_BASE}/api/subscriptions/${subscription.id}`;
        method = "PUT";
      } else {
        // Add mode: create new subscription.
        url = `${API_BASE}/api/subscriptions`;
        method = "POST";
      }
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(subscriptionData),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error saving subscription");
      }
      console.log("[DEBUG] Subscription saved successfully:", data);
      // Call the onSubmit callback to update the parent state.
      onSubmit(data);
      toast({
        title: subscription ? "Subscription Updated" : "Subscription Added",
        description: "Subscription plan was saved successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error("[ERROR] Failed to save subscription:", error);
      toast({
        title: "Error saving subscription",
        description: error.message || "An error occurred while saving.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="lg">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>
          {subscription ? "Edit Subscription" : "Add Subscription"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <FormControl id="name" isRequired>
              <FormLabel>Subscription Name</FormLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter subscription plan name"
              />
            </FormControl>
            <FormControl id="price" isRequired>
              <FormLabel>Price</FormLabel>
              <Input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
              />
            </FormControl>
            <FormControl id="duration" isRequired>
              <FormLabel>Duration</FormLabel>
              <Select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </Select>
            </FormControl>
            <FormControl id="features">
              <FormLabel>Features (JSON)</FormLabel>
              <Textarea
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder='e.g., {"users": "unlimited", "storage": "50GB"}'
                size="sm"
              />
            </FormControl>
            <FormControl id="trialPeriodDays">
              <FormLabel>Trial Period (Days)</FormLabel>
              <Input
                type="number"
                value={trialPeriodDays}
                onChange={(e) => setTrialPeriodDays(e.target.value)}
                placeholder="Enter trial period in days"
              />
            </FormControl>
            <FormControl id="status" isRequired>
              <FormLabel>Status</FormLabel>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="deprecated">Deprecated</option>
                <option value="suspended">Suspended</option>
              </Select>
            </FormControl>
            <FormControl id="autoRenew">
              <FormLabel>Auto Renew</FormLabel>
              <Switch
                isChecked={autoRenew}
                onChange={(e) => setAutoRenew(e.target.checked)}
              />
            </FormControl>
            <FormControl id="renewalDate">
              <FormLabel>Renewal Date</FormLabel>
              <Input
                type="date"
                value={renewalDate}
                onChange={(e) => setRenewalDate(e.target.value)}
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
