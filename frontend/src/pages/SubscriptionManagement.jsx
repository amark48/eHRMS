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
  Select,
  Text as ChakraText,
  useToast,
} from "@chakra-ui/react";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  TriangleUpIcon,
  TriangleDownIcon,
} from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import SubscriptionFormModal from "../components/SubscriptionFormModal";

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const toast = useToast();

  // Fetch subscriptions from your API
  useEffect(() => {
    const fetchSubscriptions = async () => {
      try {
        console.log("[DEBUG] Fetching subscription plans...");
        setLoading(true);
        const res = await fetch("/api/subscriptions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch subscriptions");
        const data = await res.json();
        console.log("[DEBUG] Fetched subscriptions:", data);
        setSubscriptions(data);
      } catch (err) {
        console.error("[ERROR] Fetching subscriptions failed:", err.message);
        setError(err.message);
        toast({
          title: "Error",
          description: err.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchSubscriptions();
  }, [toast]);

  // Filtering subscriptions based on search term.
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) =>
      // Use an empty string if sub.name is undefined.
      (sub.name ? sub.name.toLowerCase() : "").includes(searchTerm.toLowerCase())
    );
  }, [subscriptions, searchTerm]);

  // Sorting subscriptions based on sortConfig.
  const sortedSubscriptions = useMemo(() => {
    const subs = [...filteredSubscriptions];
    if (sortConfig.key) {
      subs.sort((a, b) => {
        let aKey = a[sortConfig.key];
        let bKey = b[sortConfig.key];
        // If numeric, do numeric sort.
        if (typeof aKey === "number" && typeof bKey === "number") {
          return sortConfig.direction === "asc" ? aKey - bKey : bKey - aKey;
        }
        // Otherwise, compare as strings.
        aKey = aKey ? aKey.toString().toLowerCase() : "";
        bKey = bKey ? bKey.toString().toLowerCase() : "";
        if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
        if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return subs;
  }, [filteredSubscriptions, sortConfig]);

  // Pagination: calculate total pages and current slice.
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize);
  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSubscriptions.slice(start, start + pageSize);
  }, [sortedSubscriptions, currentPage]);

  // Sorting handler triggered on column header click.
  const handleSort = (key) => {
    console.log("[DEBUG] Sorting by key:", key);
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Handlers for modal open/close.
  const openEditModal = (subscription) => {
    console.log("[DEBUG] Opening edit modal for subscription:", subscription.id);
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setEditingSubscription(null);
    setIsModalOpen(false);
  };

  // Delete subscription handler.
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this subscription plan?")) return;
    try {
      console.log("[DEBUG] Deleting subscription with ID:", id);
      const res = await fetch(`/api/subscriptions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete subscription");
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== id));
      toast({
        title: "Deleted",
        description: "Subscription deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("[ERROR] Deleting subscription failed:", err.message);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Toggle subscription status handler.
  const handleToggleStatus = async (id) => {
    try {
      console.log("[DEBUG] Toggling status for subscription ID:", id);
      const res = await fetch(`/api/subscriptions/${id}/toggle`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to toggle subscription status");
      const updatedSub = await res.json();
      setSubscriptions((prev) =>
        prev.map((sub) => (sub.id === id ? updatedSub : sub))
      );
      toast({
        title: "Status Updated",
        description: "Subscription status toggled successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      console.error("[ERROR] Toggling status failed:", err.message);
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading mb={4}>Subscription Management</Heading>
        <ChakraText color="gray.600" mb={4}>
          Manage your subscription plans.
        </ChakraText>

        {/* Search and Add button row */}
        <Flex mb={4} align="center">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            maxW="300px"
          />
          <Spacer />
          <Button
            leftIcon={<AddIcon />}
            colorScheme="blue"
            onClick={() => {
              setEditingSubscription(null);
              setIsModalOpen(true);
            }}
          >
            Add Subscription
          </Button>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th cursor="pointer" onClick={() => handleSort("name")}>
                      Name{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort("price")}>
                      Price{" "}
                      {sortConfig.key === "price" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort("duration")}>
                      Duration{" "}
                      {sortConfig.key === "duration" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th cursor="pointer" onClick={() => handleSort("status")}>
                      Status{" "}
                      {sortConfig.key === "status" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedSubscriptions.length === 0 ? (
                    <Tr>
                      <Td colSpan={5} textAlign="center">
                        No subscriptions found.
                      </Td>
                    </Tr>
                  ) : (
                    paginatedSubscriptions.map((sub) => (
                      <Tr key={sub.id}>
                        <Td>{sub.name}</Td>
                        <Td>${sub.price}</Td>
                        <Td textTransform="capitalize">{sub.duration}</Td>
                        <Td textTransform="capitalize">{sub.status}</Td>
                        <Td>
                          <IconButton
                            aria-label="Edit Subscription"
                            icon={<EditIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => openEditModal(sub)}
                          />
                          <IconButton
                            aria-label="Delete Subscription"
                            icon={<DeleteIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => handleDelete(sub.id)}
                          />
                          <Button
                            size="sm"
                            onClick={() => handleToggleStatus(sub.id)}
                          >
                            Toggle Status
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>

            {/* Pagination Controls */}
            <Flex mt={4} justify="space-between" align="center">
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.max(prev - 1, 1))
                }
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text>
                Page {currentPage} of {totalPages || 1}
              </Text>
              <Button
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </Button>
            </Flex>
          </>
        )}

        {/* Subscription Form Modal for Add/Edit */}
        {isModalOpen && (
          <SubscriptionFormModal
            isOpen={isModalOpen}
            onClose={closeModal}
            subscription={editingSubscription}
            onSubmit={(updatedSub) => {
              if (editingSubscription) {
                setSubscriptions((subs) =>
                  subs.map((sub) =>
                    sub.id === updatedSub.id ? updatedSub : sub
                  )
                );
              } else {
                setSubscriptions((subs) => [...subs, updatedSub]);
              }
              closeModal();
            }}
          />
        )}
      </Box>
    </AdminLayout>
  );
};

export default SubscriptionManagement;
