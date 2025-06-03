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
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Tooltip
} from "@chakra-ui/react";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  TriangleUpIcon,
  TriangleDownIcon,
  InfoIcon
} from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import SubscriptionFormModal from "../components/SubscriptionFormModal";
import SubscriptionDetailModal from "../components/SubscriptionDetailModal";
import SubscriptionAnalytics from "../components/SubscriptionAnalytics";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid, 
  ResponsiveContainer 
} from "recharts";

const SubscriptionManagement = () => {
  // ------------------- State Definitions -------------------
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");  // options: "", "active", "deprecated", "suspended"
  const [filterDuration, setFilterDuration] = useState(""); // options: "", "monthly", "yearly"
  const [filterAutoRenew, setFilterAutoRenew] = useState(""); // options: "", "true", "false"
  // NEW: Price Range Filters
  const [filterMinPrice, setFilterMinPrice] = useState("");
  const [filterMaxPrice, setFilterMaxPrice] = useState("");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states for add/edit/bulk edit, deletion, and detail view
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState(null);
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [bulkEditData, setBulkEditData] = useState({ status: "", duration: "", price: "" });
  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
  const deleteCancelRef = useRef();
  const [selectedSubscriptions, setSelectedSubscriptions] = useState([]);
  const [bulkDeleteAlertOpen, setBulkDeleteAlertOpen] = useState(false);
  const bulkDeleteCancelRef = useRef();
  const [detailModalSubscription, setDetailModalSubscription] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Advanced Sorting States
  const [primarySortKey, setPrimarySortKey] = useState("name");
  const [sortPrimaryDirection, setSortPrimaryDirection] = useState("asc");
  const [secondarySortKey, setSecondarySortKey] = useState("");
  const [sortSecondaryDirection, setSortSecondaryDirection] = useState("asc");

  const toast = useToast();

  // ------------------- Data Fetching -------------------
  useEffect(() => {
    async function fetchSubscriptions() {
      try {
        setLoading(true);
        const res = await fetch("/api/subscriptions", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
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
          isClosable: true
        });
      } finally {
        setLoading(false);
      }
    }
    fetchSubscriptions();
  }, [toast]);

  // ------------------- Global Metrics Dashboard -------------------
  const globalMetrics = useMemo(() => {
    const totalSubscriptions = subscriptions.length;
    const totalRevenue = subscriptions.reduce((sum, sub) => sum + Number(sub.price || 0), 0);
    // Count upcoming renewals based on renewalDate within next 30 days.
    const now = new Date();
    const upcomingRenewals = subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      const renewalDate = new Date(sub.renewalDate);
      const diffDays = (renewalDate - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).length;
    return { totalSubscriptions, totalRevenue, upcomingRenewals };
  }, [subscriptions]);

  // ------------------- Filtering Logic -------------------
  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesName = (sub.name || "").toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "" || sub.status === filterStatus;
      const matchesDuration = filterDuration === "" || sub.duration === filterDuration;
      let matchesAutoRenew = true;
      if (filterAutoRenew !== "") {
        const filterBool = filterAutoRenew === "true";
        matchesAutoRenew = sub.autoRenew === filterBool;
      }
      let matchesMinPrice = true;
      if (filterMinPrice !== "") {
        matchesMinPrice = Number(sub.price) >= Number(filterMinPrice);
      }
      let matchesMaxPrice = true;
      if (filterMaxPrice !== "") {
        matchesMaxPrice = Number(sub.price) <= Number(filterMaxPrice);
      }
      return matchesName && matchesStatus && matchesDuration && matchesAutoRenew && matchesMinPrice && matchesMaxPrice;
    });
  }, [subscriptions, searchTerm, filterStatus, filterDuration, filterAutoRenew, filterMinPrice, filterMaxPrice]);

  // ------------------- Sorting Logic -------------------
  const sortedSubscriptions = useMemo(() => {
    const subs = [...filteredSubscriptions];
    subs.sort((a, b) => {
      let result = 0;
      if (primarySortKey) {
        let aValue = a[primarySortKey] || "";
        let bValue = b[primarySortKey] || "";
        if (typeof aValue === "number" && typeof bValue === "number") {
          result = sortPrimaryDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          aValue = aValue.toString().toLowerCase();
          bValue = bValue.toString().toLowerCase();
          if (aValue < bValue) result = sortPrimaryDirection === "asc" ? -1 : 1;
          else if (aValue > bValue) result = sortPrimaryDirection === "asc" ? 1 : -1;
          else result = 0;
        }
      }
      if (result === 0 && secondarySortKey) {
        let aValue = a[secondarySortKey] || "";
        let bValue = b[secondarySortKey] || "";
        if (typeof aValue === "number" && typeof bValue === "number") {
          result = sortSecondaryDirection === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          aValue = aValue.toString().toLowerCase();
          bValue = bValue.toString().toLowerCase();
          if (aValue < bValue) result = sortSecondaryDirection === "asc" ? -1 : 1;
          else if (aValue > bValue) result = sortSecondaryDirection === "asc" ? 1 : -1;
          else result = 0;
        }
      }
      return result;
    });
    return subs;
  }, [filteredSubscriptions, primarySortKey, sortPrimaryDirection, secondarySortKey, sortSecondaryDirection]);

  // ------------------- Pagination -------------------
  const totalPages = Math.ceil(sortedSubscriptions.length / pageSize);
  const paginatedSubscriptions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedSubscriptions.slice(start, start + pageSize);
  }, [sortedSubscriptions, currentPage]);

  // ------------------- Handler Functions -------------------
  const handleSort = (key) => {
    if (primarySortKey === key) {
      setSortPrimaryDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setPrimarySortKey(key);
      setSortPrimaryDirection("asc");
    }
  };

  // Open modal for Add/Edit; for adding, editingSubscription will be null.
  const openEditModal = (subscription) => {
    setEditingSubscription(subscription);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setEditingSubscription(null);
    setIsModalOpen(false);
  };

  // Open the Add Subscription modal.
  const openAddModal = () => {
    setEditingSubscription(null);
    setIsModalOpen(true);
  };

  const openDeleteDialog = (subscription) => {
    setSubscriptionToDelete(subscription);
    setDeleteAlertOpen(true);
  };
  const closeDeleteDialog = () => {
    setDeleteAlertOpen(false);
  };
  const handleDeleteConfirmed = async () => {
    try {
      const res = await fetch(`/api/subscriptions/${subscriptionToDelete.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
      });
      if (!res.ok) throw new Error("Failed to delete subscription");
      setSubscriptions((prev) => prev.filter((sub) => sub.id !== subscriptionToDelete.id));
      toast({
        title: "Deleted",
        description: "Subscription deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      closeDeleteDialog();
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const currentPageIds = paginatedSubscriptions.map((sub) => sub.id);
      const newSelected = Array.from(new Set([...selectedSubscriptions, ...currentPageIds]));
      setSelectedSubscriptions(newSelected);
    } else {
      const currentPageIds = paginatedSubscriptions.map((sub) => sub.id);
      setSelectedSubscriptions(selectedSubscriptions.filter((id) => !currentPageIds.includes(id)));
    }
  };
  const handleSelectOne = (id) => {
    if (selectedSubscriptions.includes(id)) {
      setSelectedSubscriptions(selectedSubscriptions.filter((selected) => selected !== id));
    } else {
      setSelectedSubscriptions([...selectedSubscriptions, id]);
    }
  };

  const openBulkDeleteDialog = () => {
    setBulkDeleteAlertOpen(true);
  };
  const closeBulkDeleteDialog = () => {
    setBulkDeleteAlertOpen(false);
  };
  const handleBulkDeleteConfirmed = async () => {
    try {
      const deletePromises = selectedSubscriptions.map((id) =>
        fetch(`/api/subscriptions/${id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        })
      );
      const responses = await Promise.all(deletePromises);
      const failed = responses.filter((res) => !res.ok);
      if (failed.length) throw new Error("Some deletions failed");
      setSubscriptions((prev) => prev.filter((sub) => !selectedSubscriptions.includes(sub.id)));
      setSelectedSubscriptions([]);
      toast({
        title: "Deleted",
        description: "Selected subscriptions deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      closeBulkDeleteDialog();
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await fetch(`/api/subscriptions/${id}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
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
        isClosable: true
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const openBulkEditModal = () => {
    setIsBulkEditModalOpen(true);
  };
  const closeBulkEditModal = () => {
    setIsBulkEditModalOpen(false);
    setBulkEditData({ status: "", duration: "", price: "" });
  };
  const handleBulkEditSubmit = async () => {
    try {
      const updatePromises = selectedSubscriptions.map((id) =>
        fetch(`/api/subscriptions/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          },
          body: JSON.stringify(bulkEditData)
        }).then((res) => {
          if (!res.ok) throw new Error("Failed to update subscription with id " + id);
          return res.json();
        })
      );
      const updatedSubscriptions = await Promise.all(updatePromises);
      setSubscriptions((prev) =>
        prev.map((sub) => {
          const updated = updatedSubscriptions.find((u) => u.id === sub.id);
          return updated ? updated : sub;
        })
      );
      setSelectedSubscriptions([]);
      toast({
        title: "Updated",
        description: "Selected subscriptions updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    } finally {
      closeBulkEditModal();
    }
  };

  const openDetailModal = (subscription) => {
    setDetailModalSubscription(subscription);
    setIsDetailModalOpen(true);
  };
  const closeDetailModal = () => {
    setDetailModalSubscription(null);
    setIsDetailModalOpen(false);
  };

  // ------------------- Render JSX -------------------
  return (
    <AdminLayout>
      <Box p={6}>
        <Heading mb={4}>Subscription Management</Heading>
        <ChakraText color="gray.600" mb={4}>
          Manage your subscription plans.
        </ChakraText>

        {/* Reports & Analytics Section */}
        <Box mb={6} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Heading as="h3" size="md" mb={4}>
            Reports & Analytics
          </Heading>
          <SubscriptionAnalytics subscriptions={subscriptions} />
        </Box>

        {/* Global Metrics Dashboard */}
        <Flex mb={6} justify="space-around" align="center" p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Box textAlign="center">
            <Text fontSize="sm" color="gray.500">Total Subscriptions</Text>
            <Text fontSize="2xl" fontWeight="bold">{globalMetrics.totalSubscriptions}</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="sm" color="gray.500">Total Revenue ($)</Text>
            <Text fontSize="2xl" fontWeight="bold">{globalMetrics.totalRevenue.toFixed(2)}</Text>
          </Box>
          <Box textAlign="center">
            <Text fontSize="sm" color="gray.500">Upcoming Renewals</Text>
            <Text fontSize="2xl" fontWeight="bold">{globalMetrics.upcomingRenewals}</Text>
          </Box>
        </Flex>

        {/* Filters & Add Subscription Button in One Row (non-wrapping) */}
        <Flex mb={4} align="center" justify="space-between" flexWrap="nowrap">
          <Flex gap={2} flex="1" overflowX="auto">
            <Input
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              maxW="200px"
            />
            <Select
              placeholder="Status"
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              maxW="150px"
            >
              <option value="active">Active</option>
              <option value="deprecated">Deprecated</option>
              <option value="suspended">Suspended</option>
            </Select>
            <Select
              placeholder="Duration"
              value={filterDuration}
              onChange={(e) => { setFilterDuration(e.target.value); setCurrentPage(1); }}
              maxW="150px"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </Select>
            <Select
              placeholder="Auto Renew"
              value={filterAutoRenew}
              onChange={(e) => { setFilterAutoRenew(e.target.value); setCurrentPage(1); }}
              maxW="150px"
            >
              <option value="true">Yes</option>
              <option value="false">No</option>
            </Select>
            <Input
              placeholder="Min Price"
              type="number"
              value={filterMinPrice}
              onChange={(e) => { setFilterMinPrice(e.target.value); setCurrentPage(1); }}
              maxW="120px"
            />
            <Input
              placeholder="Max Price"
              type="number"
              value={filterMaxPrice}
              onChange={(e) => { setFilterMaxPrice(e.target.value); setCurrentPage(1); }}
              maxW="120px"
            />
          </Flex>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={openAddModal} ml={4}>
            Add Subscription
          </Button>
        </Flex>

        {/* Table */}
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
                    <Th p={1} minW="30px">
                      <Checkbox
                        size="sm"
                        isChecked={
                          paginatedSubscriptions.length > 0 &&
                          paginatedSubscriptions.every((sub) =>
                            selectedSubscriptions.includes(sub.id)
                          )
                        }
                        onChange={handleSelectAll}
                      />
                    </Th>
                    <Th p={1}>
                      <Tooltip label="Subscription Name" hasArrow>
                        <span onClick={() => handleSort("name")} style={{ cursor: "pointer" }}>
                          Name{" "}
                          {primarySortKey === "name" &&
                            (sortPrimaryDirection === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
                        </span>
                      </Tooltip>
                    </Th>
                    <Th p={1}>
                      <Tooltip label="Price (USD)" hasArrow>
                        <span onClick={() => handleSort("price")} style={{ cursor: "pointer" }}>
                          Price{" "}
                          {primarySortKey === "price" &&
                            (sortPrimaryDirection === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
                        </span>
                      </Tooltip>
                    </Th>
                    <Th p={1}>
                      <Tooltip label="Billing Duration" hasArrow>
                        <span onClick={() => handleSort("duration")} style={{ cursor: "pointer" }}>
                          Duration{" "}
                          {primarySortKey === "duration" &&
                            (sortPrimaryDirection === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
                        </span>
                      </Tooltip>
                    </Th>
                    <Th p={1}>
                      <Tooltip label="Current Status" hasArrow>
                        <span onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                          Status{" "}
                          {primarySortKey === "status" &&
                            (sortPrimaryDirection === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
                        </span>
                      </Tooltip>
                    </Th>
                    <Th p={1} textAlign="right" pr={4}>
                      Actions
                    </Th>
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
                        <Td p={1}>
                          <Checkbox
                            size="sm"
                            isChecked={selectedSubscriptions.includes(sub.id)}
                            onChange={() => handleSelectOne(sub.id)}
                          />
                        </Td>
                        <Td p={1}>{sub.name}</Td>
                        <Td p={1}>${sub.price}</Td>
                        <Td p={1} textTransform="capitalize">{sub.duration}</Td>
                        <Td p={1} textTransform="capitalize">{sub.status}</Td>
                        <Td p={1} textAlign="right" pr={4}>
                          <IconButton
                            aria-label="View Details"
                            icon={<InfoIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => openDetailModal(sub)}
                          />
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
                          <Button size="sm" onClick={() => handleToggleStatus(sub.id)}>
                            Toggle Status
                          </Button>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
            {/* Pagination with Jump-to-Page Input */}
            <Flex mt={4} justify="space-between" align="center" flexWrap="nowrap">
              <Button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Previous
              </Button>
              <ChakraText>
                Page {currentPage} of {totalPages || 1}
              </ChakraText>
              <Button onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages || totalPages === 0}>
                Next
              </Button>
              <Flex align="center" gap={2}>
                <ChakraText>Jump to Page:</ChakraText>
                <Input
                  type="number"
                  size="sm"
                  maxW="60px"
                  onChange={(e) => {
                    let page = Number(e.target.value);
                    if (page > 0 && page <= totalPages) setCurrentPage(page);
                  }}
                />
              </Flex>
            </Flex>
          </>
        )}

        {/* ------------------- Modals and Dialogs ------------------- */}
        {/* Subscription Form Modal for Add/Edit */}
        {isModalOpen && (
          <SubscriptionFormModal
            isOpen={isModalOpen}
            onClose={closeModal}
            subscription={editingSubscription}
            onSubmit={(updatedSub) => {
              if (editingSubscription) {
                setSubscriptions((subs) =>
                  subs.map((sub) => (sub.id === updatedSub.id ? updatedSub : sub))
                );
              } else {
                setSubscriptions((subs) => [...subs, updatedSub]);
              }
              closeModal();
            }}
          />
        )}
        {/* AlertDialog for Single Deletion */}
        <AlertDialog isOpen={deleteAlertOpen} leastDestructiveRef={deleteCancelRef} onClose={closeDeleteDialog} isCentered>
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
        <AlertDialog isOpen={bulkDeleteAlertOpen} leastDestructiveRef={bulkDeleteCancelRef} onClose={closeBulkDeleteDialog} isCentered>
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
        {/* Bulk Edit Modal */}
        {isBulkEditModalOpen && (
          <Modal isOpen={isBulkEditModalOpen} onClose={closeBulkEditModal} isCentered>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Bulk Edit Subscriptions</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <FormControl mb={4}>
                  <FormLabel>Status</FormLabel>
                  <Select
                    placeholder="No Change"
                    value={bulkEditData.status}
                    onChange={(e) =>
                      setBulkEditData((prev) => ({ ...prev, status: e.target.value }))
                    }
                  >
                    <option value="active">Active</option>
                    <option value="deprecated">Deprecated</option>
                    <option value="suspended">Suspended</option>
                  </Select>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Duration</FormLabel>
                  <Select
                    placeholder="No Change"
                    value={bulkEditData.duration}
                    onChange={(e) =>
                      setBulkEditData((prev) => ({ ...prev, duration: e.target.value }))
                    }
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </Select>
                </FormControl>
                <FormControl mb={4}>
                  <FormLabel>Price</FormLabel>
                  <Input
                    placeholder="Enter new price"
                    type="number"
                    value={bulkEditData.price}
                    onChange={(e) =>
                      setBulkEditData((prev) => ({ ...prev, price: e.target.value }))
                    }
                  />
                </FormControl>
              </ModalBody>
              <ModalFooter>
                <Button variant="ghost" mr={3} onClick={closeBulkEditModal}>
                  Cancel
                </Button>
                <Button colorScheme="blue" onClick={handleBulkEditSubmit}>
                  Save Changes
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
        {/* Detail View Modal */}
        {isDetailModalOpen && (
          <SubscriptionDetailModal
            isOpen={isDetailModalOpen}
            onClose={closeDetailModal}
            subscription={detailModalSubscription}
          />
        )}
      </Box>
    </AdminLayout>
  );
};

export default SubscriptionManagement;
