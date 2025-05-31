// src/pages/SubscriptionManagement.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Spacer,
  Button,
  Input,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Spinner,
  Tooltip,
  useDisclosure,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import SubscriptionFormModal from "../components/SubscriptionFormModal";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Modal disclosure hooks for adding and editing
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();

  // Fetch subscriptions when the component mounts.
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        const response = await fetch("/api/subscriptions");
        if (!response.ok) throw new Error("Failed to fetch subscriptions");
        const data = await response.json();
        setSubscriptions(data);
      } catch (error) {
        console.error("Error fetching subscriptions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptions();
  }, []);

  // Filter subscriptions based on search term (e.g., filtering by plan name)
  const filteredSubscriptions = useMemo(() => {
    if (!searchTerm) return subscriptions;
    return subscriptions.filter((sub) =>
      sub.planName && sub.planName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subscriptions, searchTerm]);

  // Handler for deleting a subscription
  const handleDeleteSubscription = async (subscriptionId) => {
    try {
      const response = await fetch(`/api/subscriptions/${subscriptionId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete subscription");
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionId));
    } catch (error) {
      console.error("Error deleting subscription:", error);
    }
  };

  // Handler for adding a subscription (called from the modal)
  const handleAddSubscription = (newSubscription) => {
    setSubscriptions([...subscriptions, newSubscription]);
    onAddClose();
  };

  // Handler for editing a subscription (called from the modal)
  const handleEditSubscription = (updatedSubscription) => {
    setSubscriptions(
      subscriptions.map((sub) => (sub.id === updatedSubscription.id ? updatedSubscription : sub))
    );
    onEditClose();
    setEditingSubscription(null);
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="lg" mb={4}>
          Subscription Management
        </Heading>
        <Text color="gray.600" mb={4}>
          Manage subscription plans and pricing for your platform.
        </Text>

        <Flex mb={4} alignItems="center">
          <Input
            placeholder="Search subscriptions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onAddOpen}>
            Add Subscription
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Plan Name</Th>
                  <Th>Price</Th>
                  <Th>Duration</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredSubscriptions.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      No subscriptions found.
                    </Td>
                  </Tr>
                ) : (
                  filteredSubscriptions.map((sub) => (
                    <Tr key={sub.id} _hover={{ bg: "gray.100" }}>
                      <Td>{sub.planName}</Td>
                      <Td>{sub.price}</Td>
                      <Td>{sub.duration}</Td>
                      <Td>{sub.isActive ? "Active" : "Inactive"}</Td>
                      <Td>
                        <Tooltip label="Edit Subscription">
                          <IconButton
                            aria-label="Edit subscription"
                            icon={<EditIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => {
                              setEditingSubscription(sub);
                              onEditOpen();
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Delete Subscription">
                          <IconButton
                            aria-label="Delete subscription"
                            icon={<DeleteIcon />}
                            size="sm"
                            onClick={() => handleDeleteSubscription(sub.id)}
                          />
                        </Tooltip>
                      </Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {/* Modal for Adding a Subscription */}
      <SubscriptionFormModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        mode="add"
        onSubmit={handleAddSubscription}
      />

      {/* Modal for Editing a Subscription */}
      {editingSubscription && (
        <SubscriptionFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          mode="edit"
          initialData={editingSubscription}
          onSubmit={handleEditSubscription}
        />
      )}
    </AdminLayout>
  );
};

export default SubscriptionManagement;