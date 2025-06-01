// src/pages/SubscriptionManagement.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
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
  useToast,
  Text as ChakraText,
  Select,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  FormControl,
  FormLabel,
  Checkbox,
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
  // Basic state & data fetching
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Basic search input
  const [searchTerm, setSearchTerm] = useState("");

  // Additional Filters
  const [filterStatus, setFilterStatus] = useState(""); // "", "active", "deprecated", "suspended"
  const [filterDuration, setFilterDuration] = useState(""); // "", "monthly", "yearly"
  const [filterAutoRenew, setFilterAutoRenew] = useState(""); // "", "true", "false"

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal state for add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);

  // Delete confirmation dialog for single deletion
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const deleteCancelRef = useRef();

  // Bulk deletion state
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);
  const bulkDeleteCancelRef = useRef();

  // Advanced Sorting States
  const [primarySortKey, setPrimarySortKey] = useState("name");
  const [sortPrimaryDirection, setSortPrimaryDirection] = useState("asc");
  const [secondarySortKey, setSecondarySortKey] = useState("");
  const [sortSecondaryDirection, setSortSecondaryDirection] = useState("asc");

  const toast = useToast();

  // Fetch subscriptions from API on mount.
  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setLoading(true);
        const res = await fetch("/api/subscriptions", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        });
        if (!res.ok) throw new Error("Failed to fetch subscriptions");
        const data = await res.json();
        setSubscriptions(data);
      } catch (err) {
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
    }
    fetchSubscriptions();
  }, [toast]);

  // Combine basic search and additional filters.
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesName = (sub.name ? sub.name.toLowerCase() : "").includes(
        searchTerm.toLowerCase()
      );
      const matchesStatus = filterStatus === "" || sub.status === filterStatus;
      const matchesDuration =
        filterDuration === "" || sub.duration === filterDuration;
      let matchesAutoRenew = true;
      if (filterAutoRenew !== "") {
        const filterBool = filterAutoRenew === "true";
        matchesAutoRenew = sub.autoRenew === filterBool;
      }
      return matchesName && matchesStatus && matchesDuration && matchesAutoRenew;
    });
  }, [subscriptions, searchTerm, filterStatus, filterDuration, filterAutoRenew]);

  // Multi-parameter sorting.
  const sortedSubscriptions = useMemo(() => {
    const subs = [...filteredSubscriptions];
    subs.sort((a, b) => {
      let result = 0;
      if (primarySortKey) {
        let aValue = a[primarySortKey] || "";
        let bValue = b[primarySortKey] || "";
        if (typeof aValue === "number" && typeof bValue === "number") {
          result =
            sortPrimaryDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          aValue = aValue.toString().toLowerCase();
          bValue = bValue.toString().toLowerCase();
          result =
            aValue < bValue
              ? sortPrimaryDirection === "asc"
                ? -1
                : 1
              : aValue > bValue
              ? sortPrimaryDirection === "asc"
                ? 1
                : -1
              : 0;
        }
      }
      if (result === 0 && secondarySortKey) {
        let aValue = a[secondarySortKey] || "";
        let bValue = b[secondarySortKey] || "";
        if (typeof aValue === "number" && typeof bValue === "number") {
          result =
            sortSecondaryDirection === "asc"
              ? aValue - bValue
              : bValue - aValue;
        } else {
          aValue = aValue.toString().toLowerCase();
          bValue = bValue.toString().toLowerCase();
          result =
            aValue < bValue
              ? sortSecondaryDirection === "asc"
                ? -1
                : 1
              : aValue > bValue
              ? sortSecondaryDirection === "asc"
                ? 1
                : -1
              : 0;
        }
      }
      return result;
    });
    return subs;
  }, [
    filteredSubscriptions,
    primarySortKey,
    sortPrimaryDirection,
    secondarySortKey,
    sortSecondaryDirection,
  ]);

  // Pagination calculations.
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize);
  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSubscriptions.slice(start, start + pageSize);
  }, [sortedSubscriptions, currentPage]);

  // Handler for clicking a column header to update primary sort.
  const handleSort = (key) => {
    if (primarySortKey === key) {
      setSortPrimaryDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPrimarySortKey(key);
      setSortPrimaryDirection("asc");
    }
  };

  // --- Function declarations to ensure hoisting ---

  function openEditModal(subscription) {
    console.log("[DEBUG] Opening edit modal for subscription:", subscription.id);
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  }

  function closeModal() {
    setEditingSubscription(null);
    setIsModalOpen(false);
  }

  function openDeleteDialog(subscription) {
    console.log("[DEBUG] Opening delete confirmation for:", subscription.id);
    setSubscriptionToDelete(subscription);
    setDeleteAlertOpen(true);
  }

  function closeDeleteDialog() {
    setDeleteAlertOpen(false);
  }

  async function handleDeleteConfirmed() {
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionToDelete.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      });
      if (!res.ok) throw new Error("Failed to delete subscription");
      setSubscriptions((prev) =>
        prev.filter((sub) => sub.id !== subscriptionToDelete.id)
      );
      toast({
        title: "Deleted",
        description: "Subscription deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      closeDeleteDialog();
    }
  }

  // Bulk selection handlers.
  function handleSelectAll(e) {
    if (e.target.checked) {
      const currentPageIds = paginatedSubscriptions.map((sub) => sub.id);
      const newSelected = Array.from(
        new Set([...selectedSubscriptions, ...currentPageIds])
      );
      setSelectedSubscriptions(newSelected);
    } else {
      const currentPageIds = paginatedSubscriptions.map((sub) => sub.id);
      const newSelected = selectedSubscriptions.filter(
        (id) => !currentPageIds.includes(id)
      );
      setSelectedSubscriptions(newSelected);
    }
  }

  function handleSelectOne(id) {
    if (selectedSubscriptions.includes(id)) {
      setSelectedSubscriptions(
        selectedSubscriptions.filter((selected) => selected !== id)
      );
    } else {
      setSelectedSubscriptions([...selectedSubscriptions, id]);
    }
  }

  // Bulk deletion handlers.
  function openBulkDeleteDialog() {
    setBulkDeleteAlertOpen(true);
  }

  function closeBulkDeleteDialog() {
    setBulkDeleteAlertOpen(false);
  }

  async function handleBulkDeleteConfirmed() {
    try {
      const deletePromises = selectedSubscriptions.map((id) =>
        fetch(`/api/subscriptions/${id}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          },
        })
      );
      const responses = await Promise.all(deletePromises);
      const failed = responses.filter((res) => !res.ok);
      if (failed.length) {
        throw new Error("Some deletions failed");
      }
      setSubscriptions((prev) =>
        prev.filter((sub) => !selectedSubscriptions.includes(sub.id))
      );
      setSelectedSubscriptions([]);
      toast({
        title: "Deleted",
        description: "Selected subscriptions deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      closeBulkDeleteDialog();
    }
  }

  async function handleToggleStatus(id) {
    try {
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
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  }

  // --- End function declarations ---

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading mb={4}>Subscription Management</Heading>
        <ChakraText color="gray.600" mb={4}>
          Manage your subscription plans.
        </ChakraText>

        {/* Top Row: Search, Filters & Add Subscription */}
        <Flex mb={4} align="center" justify="space-between" flexWrap="nowrap">
          <Flex align="center">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              maxW="200px"
              mr={2}
            />
            <Select
              placeholder="Status"
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              maxW="150px"
              mr={2}
            >
              <option value="active">Active</option>
              <option value="deprecated">Deprecated</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Select
              placeholder="Duration"
              value={filterDuration}
              onChange={(e) => {
                setFilterDuration(e.target.value);
                setCurrentPage(1);
              }}
              maxW="150px"
              mr={2}
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
            <Select
              placeholder="Auto Renew"
              value={filterAutoRenew}
              onChange={(e) => {
                setFilterAutoRenew(e.target.value);
                setCurrentPage(1);
              }}
              maxW="150px"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
          </Flex>
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

        {/* Bulk Actions Bar */}
        {selectedSubscriptions.length > 0 && (
          <Flex mb={4} align="center" justify="flex-end" gap={4}>
            <Text>{selectedSubscriptions.length} selected</Text>
            <Button size="sm" colorScheme="red" onClick={openBulkDeleteDialog}>
              Delete Selected
            </Button>
            <Button size="sm" onClick={() => setSelectedSubscriptions([])}>
              Clear Selection
            </Button>
          </Flex>
        )}

        {/* Advanced Sorting Options */}
        <Flex mb={4} align="center" flexWrap="nowrap" gap={4}>
          <Box>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0" whiteSpace="nowrap" fontWeight="bold" mr={2}>
                Primary Sort:
              </FormLabel>
              <Select
                value={primarySortKey}
                onChange={(e) => setPrimarySortKey(e.target.value)}
                size="sm"
                maxW="150px"
              >
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
                <option value="status">Status</option>
                <option value="trialPeriodDays">Trial Days</option>
              </Select>
              <Select
                value={sortPrimaryDirection}
                onChange={(e) => setSortPrimaryDirection(e.target.value)}
                size="sm"
                maxW="100px"
                ml={2}
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </Select>
            </FormControl>
          </Box>
          <Box>
            <FormControl display="flex" alignItems="center">
              <FormLabel mb="0" whiteSpace="nowrap" fontWeight="bold" mr={2}>
                Secondary Sort:
              </FormLabel>
              <Select
                value={secondarySortKey}
                onChange={(e) => setSecondarySortKey(e.target.value)}
                size="sm"
                maxW="150px"
                mr={2}
              >
                <option value="">None</option>
                <option value="name">Name</option>
                <option value="price">Price</option>
                <option value="duration">Duration</option>
                <option value="status">Status</option>
                <option value="trialPeriodDays">Trial Days</option>
              </Select>
              {secondarySortKey && (
                <Select
                  value={sortSecondaryDirection}
                  onChange={(e) => setSortSecondaryDirection(e.target.value)}
                  size="sm"
                  maxW="100px"
                  ml={2}
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </Select>
              )}
            </FormControl>
          </Box>
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
                    <Th>
                      <Checkbox
                        isChecked={
                          paginatedSubscriptions.length > 0 &&
                          paginatedSubscriptions.every((sub) =>
                            selectedSubscriptions.includes(sub.id)
                          )
                        }
                        onChange={handleSelectAll}
                      />
                    </Th>
                    <Th onClick={() => handleSort("name")} cursor="pointer">
                      Name{" "}
                      {primarySortKey === "name" &&
                        (sortPrimaryDirection === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th onClick={() => handleSort("price")} cursor="pointer">
                      Price{" "}
                      {primarySortKey === "price" &&
                        (sortPrimaryDirection === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th onClick={() => handleSort("duration")} cursor="pointer">
                      Duration{" "}
                      {primarySortKey === "duration" &&
                        (sortPrimaryDirection === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th onClick={() => handleSort("status")} cursor="pointer">
                      Status{" "}
                      {primarySortKey === "status" &&
                        (sortPrimaryDirection === "asc" ? (
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
                      <Td colSpan={6} textAlign="center">
                        No subscriptions found.
                      </Td>
                    </Tr>
                  ) : (
                    paginatedSubscriptions.map((sub) => (
                      <Tr key={sub.id}>
                        <Td>
                          <Checkbox
                            isChecked={selectedSubscriptions.includes(sub.id)}
                            onChange={() => handleSelectOne(sub.id)}
                          />
                        </Td>
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
                            onClick={() => openDeleteDialog(sub)}
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
            <Flex mt={4} justify="space-between" align="center">
              <Button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text>
                Page {currentPage} of {totalPages || 1}
              </Text>
              <Button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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

        {/* AlertDialog for Single Deletion */}
        <AlertDialog
          isOpen={deleteAlertOpen}
          leastDestructiveRef={deleteCancelRef}
          onClose={closeDeleteDialog}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Subscription
              </AlertDialogHeader>
              <AlertDialogBody>
                {`Are you sure you want to delete the subscription ${
                  subscriptionToDelete ? subscriptionToDelete.name : ""
                }? This action cannot be undone.`}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={deleteCancelRef} onClick={closeDeleteDialog}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleDeleteConfirmed} ml={3}>
                  Delete
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>

        {/* AlertDialog for Bulk Deletion */}
        <AlertDialog
          isOpen={bulkDeleteAlertOpen}
          leastDestructiveRef={bulkDeleteCancelRef}
          onClose={closeBulkDeleteDialog}
          isCentered
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Delete Selected Subscriptions
              </AlertDialogHeader>
              <AlertDialogBody>
                {`Are you sure you want to delete the selected subscriptions? This action cannot be undone.`}
              </AlertDialogBody>
              <AlertDialogFooter>
                <Button ref={bulkDeleteCancelRef} onClick={closeBulkDeleteDialog}>
                  Cancel
                </Button>
                <Button colorScheme="red" onClick={handleBulkDeleteConfirmed} ml={3}>
                  Delete Selected
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </Box>
    </AdminLayout>
  );
};

export default SubscriptionManagement;
