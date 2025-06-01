// frontend/src/pages/TenantManagement.jsx

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Table,
  Tab,
  Tabs,
  TabPanels,
  TabPanel,
  TabList,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  IconButton,
  Button,
  Input,
  InputGroup,
  InputLeftElement,
  Flex,
  Select,
  Spinner,
  Avatar,
  Tooltip,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from "@chakra-ui/react";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  UnlockIcon,
  SearchIcon,
  TriangleDownIcon,
  TriangleUpIcon,
  InfoIcon,
} from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import TenantFormModal from "../components/TenantFormModal";

// Custom debounce hook.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const TenantManagement = () => {
  // Existing tenant list states.
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "" = All, "active" or "disabled"
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState(null);
  const toast = useToast();

  // New state for subscriptions, used in joining and filtering.
  const [subscriptions, setSubscriptions] = useState([]);
  // New state for subscription filter.
  const [subscriptionFilter, setSubscriptionFilter] = useState("");

  // For the Insights modal.
  const {
    isOpen: isInsightOpen,
    onOpen: onInsightOpen,
    onClose: onInsightClose,
  } = useDisclosure();
  const [insightTenant, setInsightTenant] = useState(null);

  // Chakra disclosures for Add/Edit/Delete modals.
  const {
    isOpen: isAddOpen,
    onOpen: onAddOpen,
    onClose: onAddClose,
  } = useDisclosure();
  const {
    isOpen: isEditOpen,
    onOpen: onEditOpen,
    onClose: onEditClose,
  } = useDisclosure();
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const cancelRef = useRef();

  // Pagination state.
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting state.
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Debounce the search term for performance.
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // API base URL.
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  // Fetch tenants and subscriptions together.
  const fetchTenantsAndSubscriptions = async () => {
    setLoading(true);
    try {
      // Fetch tenants list.
      const tenantResponse = await fetch(`${API_BASE}/api/tenants`, {
        headers: { "Content-Type": "application/json" },
      });
      if (!tenantResponse.ok) {
        throw new Error("Failed to fetch tenants");
      }
      const tenantData = await tenantResponse.json();

      // Fetch subscriptions list.
      const token = localStorage.getItem("authToken");
      const subResponse = await fetch(`${API_BASE}/api/subscriptions`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      let subscriptionData = [];
      if (subResponse.ok) {
        subscriptionData = await subResponse.json();
        setSubscriptions(subscriptionData); // store locally for later lookups & filter options
      } else {
        console.error("Failed to fetch subscriptions");
      }

      // Create a mapping from subscription.id to subscription.
      const subMap = subscriptionData.reduce((acc, sub) => {
        acc[sub.id] = sub;
        return acc;
      }, {});

      // For each tenant, join the subscription using tenant.subscriptionId.
      const combinedData = tenantData.map((tenant) => ({
        ...tenant,
        subscription:
          tenant.subscriptionId && subMap[tenant.subscriptionId]
            ? subMap[tenant.subscriptionId]
            : null,
      }));

      setTenants(combinedData);
    } catch (error) {
      toast({
        title: "Error fetching tenants",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch.
  useEffect(() => {
    fetchTenantsAndSubscriptions();
  }, []);

  // Filtering logic: search term, status and subscription.
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const termMatch = tenant.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      let statusMatch = true;
      if (statusFilter === "active") {
        statusMatch = tenant.isActive;
      } else if (statusFilter === "disabled") {
        statusMatch = !tenant.isActive;
      }
      let subscriptionMatch = true;
      if (subscriptionFilter) {
        // tenant must have a subscription and its id must match.
        subscriptionMatch =
          tenant.subscription && tenant.subscription.id === subscriptionFilter;
      }
      return termMatch && statusMatch && subscriptionMatch;
    });
  }, [tenants, debouncedSearchTerm, statusFilter, subscriptionFilter]);

  // Sorting logic.
  const filteredAndSortedTenants = useMemo(() => {
    const sorted = [...filteredTenants];
    if (sortConfig != null) {
      sorted.sort((a, b) => {
        if (sortConfig.key === "createdAt") {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        } else if (sortConfig.key === "subscription") {
          // sort by subscription tier/name (if available)
          const subA = a.subscription ? (a.subscription.subscriptionTier || a.subscription.name || "") : "";
          const subB = b.subscription ? (b.subscription.subscriptionTier || b.subscription.name || "") : "";
          return sortConfig.direction === "asc"
            ? subA.localeCompare(subB)
            : subB.localeCompare(subA);
        } else {
          const aKey = (a[sortConfig.key] || "").toString().toLowerCase();
          const bKey = (b[sortConfig.key] || "").toString().toLowerCase();
          if (aKey < bKey) return sortConfig.direction === "asc" ? -1 : 1;
          if (aKey > bKey) return sortConfig.direction === "asc" ? 1 : -1;
          return 0;
        }
      });
    }
    return sorted;
  }, [filteredTenants, sortConfig]);

  // Pagination calculation.
  const totalPages = Math.ceil(filteredAndSortedTenants.length / pageSize);
  const paginatedTenants = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedTenants.slice(start, start + pageSize);
  }, [filteredAndSortedTenants, currentPage, pageSize]);

  // Sorting handler.
  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Handler for toggling tenant status (same as before).
  const handleToggleTenantStatus = async (tenantId) => {
    try {
      const response = await fetch(`${API_BASE}/api/tenants/${tenantId}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) throw new Error("Error toggling tenant status");
      const updatedTenant = await response.json();
      // Merge in the existing joined subscription data.
      const existingTenant = tenants.find((tenant) => tenant.id === tenantId);
      const mergedTenant = {
        ...updatedTenant,
        subscription: existingTenant ? existingTenant.subscription : null,
      };
      setTenants((prev) =>
        prev.map((tenant) => (tenant.id === tenantId ? mergedTenant : tenant))
      );
      toast({
        title: "Tenant status updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Error updating tenant status",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handler for delete action.
  const openDeleteDialog = (tenant) => {
    setTenantToDelete(tenant);
    onDeleteOpen();
  };

  const handleDeleteTenantConfirm = async () => {
    if (!tenantToDelete) return;
    try {
      const response = await fetch(`${API_BASE}/api/tenants/${tenantToDelete.id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Error deleting tenant");
      setTenants((prev) =>
        prev.filter((tenant) => tenant.id !== tenantToDelete.id)
      );
      toast({
        title: "Tenant deleted successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onDeleteClose();
      setTenantToDelete(null);
    } catch (error) {
      toast({
        title: "Error deleting tenant",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handler for adding tenant.
  const handleAddTenant = async (tenantData) => {
    try {
      const response = await fetch(`${API_BASE}/api/tenants`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantData),
      });
      if (!response.ok) throw new Error("Error adding tenant");
      const newTenant = await response.json();
      // Look up and merge the joined subscription.
      const sub = subscriptions.find((s) => s.id === newTenant.subscriptionId);
      newTenant.subscription = sub || null;
      setTenants((prev) => [...prev, newTenant]);
      toast({
        title: "Tenant added successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onAddClose();
    } catch (error) {
      toast({
        title: "Error adding tenant",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handler for editing tenant.
  const handleEditTenant = async (tenantData) => {
    try {
      const response = await fetch(`${API_BASE}/api/tenants/${editingTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantData),
      });
      if (!response.ok) throw new Error("Error updating tenant");
      const updatedTenant = await response.json();
      // Look up the subscription from the stored subscriptions.
      const sub = subscriptions.find(
        (s) => s.id === updatedTenant.subscriptionId
      );
      const mergedTenant = { ...updatedTenant, subscription: sub || null };
      setTenants((prev) =>
        prev.map((t) => (t.id === editingTenant.id ? mergedTenant : t))
      );
      toast({
        title: "Tenant updated successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onEditClose();
      setEditingTenant(null);
    } catch (error) {
      toast({
        title: "Error updating tenant",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handler to open the Insights modal.
  const handleOpenInsight = (tenant) => {
    setInsightTenant(tenant);
    onInsightOpen();
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading mb={4}>Tenant Management</Heading>
        <Text color="gray.600" mb={6}>
          Manage your tenant configurations.
        </Text>
        {/* Header: Existing Search/Status Filters + New Subscription Filter */}
        <Flex mb={4} alignItems="center" justifyContent="space-between">
          <Flex alignItems="center">
            <InputGroup maxW="300px">
              <InputLeftElement pointerEvents="none">
                <SearchIcon color="gray.400" />
              </InputLeftElement>
              <Input
                placeholder="Search tenants..."
                size="sm"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </InputGroup>
            <Select
              size="sm"
              maxW="200px"
              ml={4}
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </Select>
            {/* New Subscription Filter */}
            <Select
              size="sm"
              maxW="200px"
              ml={4}
              value={subscriptionFilter}
              onChange={(e) => {
                setSubscriptionFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="">All Subscriptions</option>
              {subscriptions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.subscriptionTier || sub.name}
                </option>
              ))}
            </Select>
          </Flex>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onAddOpen}>
            Add Tenant
          </Button>
        </Flex>
        {/* Tenants Table */}
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
                    <Th>Logo</Th>
                    <Th
                      cursor="pointer"
                      onClick={() => handleSort("name")}
                    >
                      Name{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th>Domain</Th>
                    <Th
                      cursor="pointer"
                      onClick={() => handleSort("subscription")}
                    >
                      Subscription Tier{" "}
                      {sortConfig.key === "subscription" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th>Status</Th>
                    <Th
                      cursor="pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created At{" "}
                      {sortConfig.key === "createdAt" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th isNumeric>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {paginatedTenants.length === 0 ? (
                    <Tr>
                      <Td colSpan={7} textAlign="center">
                        No tenants found.
                      </Td>
                    </Tr>
                  ) : (
                    paginatedTenants.map((tenant) => (
                      <Tr key={tenant.id}>
                        <Td>
                          <Avatar size="sm" src={tenant.logoUrl} name={tenant.name} />
                        </Td>
                        <Td>{tenant.name}</Td>
                        <Td>{tenant.domain}</Td>
                        <Td>
                          {tenant.subscription
                            ? tenant.subscription.subscriptionTier ||
                              tenant.subscription.name ||
                              "N/A"
                            : "None"}
                        </Td>
                        <Td>{tenant.isActive ? "Active" : "Disabled"}</Td>
                        <Td>
                          {tenant.createdAt
                            ? new Date(tenant.createdAt).toLocaleString()
                            : "N/A"}
                        </Td>
                        <Td isNumeric>
                          <Tooltip label="View Insights">
                            <IconButton
                              aria-label="View Tenant Insights"
                              icon={<InfoIcon />}
                              mr={2}
                              size="sm"
                              onClick={() => handleOpenInsight(tenant)}
                            />
                          </Tooltip>
                          <Tooltip label="Edit Tenant">
                            <IconButton
                              aria-label="Edit tenant"
                              icon={<EditIcon />}
                              mr={2}
                              size="sm"
                              onClick={() => {
                                setEditingTenant(tenant);
                                onEditOpen();
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Delete Tenant">
                            <IconButton
                              aria-label="Delete tenant"
                              icon={<DeleteIcon />}
                              mr={2}
                              size="sm"
                              onClick={() => {
                                setEditingTenant(null);
                                openDeleteDialog(tenant);
                              }}
                            />
                          </Tooltip>
                          <Tooltip label={tenant.isActive ? "Disable Tenant" : "Enable Tenant"}>
                            <IconButton
                              aria-label={tenant.isActive ? "Disable tenant" : "Enable tenant"}
                              icon={tenant.isActive ? <LockIcon /> : <UnlockIcon />}
                              size="sm"
                              onClick={() => handleToggleTenantStatus(tenant.id)}
                            />
                          </Tooltip>
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
      </Box>
      {/* Delete Confirmation Dialog */}
      <AlertDialog isOpen={isDeleteOpen} leastDestructiveRef={cancelRef} onClose={onDeleteClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Tenant
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete the tenant{" "}
              <strong>{tenantToDelete?.name}</strong>? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteTenantConfirm} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
      {/* Add Tenant Modal */}
      <TenantFormModal
        isOpen={isAddOpen}
        onClose={() => {
          setEditingTenant(null);
          onAddClose();
        }}
        mode="add"
        onSubmit={handleAddTenant}
      />
      {/* Edit Tenant Modal */}
      {editingTenant && (
        <TenantFormModal
          isOpen={isEditOpen}
          onClose={() => {
            setEditingTenant(null);
            onEditClose();
          }}
          mode="edit"
          initialData={editingTenant}
          onSubmit={handleEditTenant}
        />
      )}
      {/* Tenant Insights Modal */}
{insightTenant && (
  <Modal isOpen={isInsightOpen} onClose={onInsightClose} size="xl" isCentered>
    <ModalOverlay />
    <ModalContent>
      <ModalHeader>Tenant Insights: {insightTenant.name}</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        {/* Branding & Basic Info */}
        <Flex align="center" mb={4}>
          <Avatar size="xl" src={insightTenant.logoUrl} name={insightTenant.name} mr={4} />
          <Box>
            <Text fontSize="2xl" fontWeight="bold">{insightTenant.name}</Text>
            <Text color="gray.600">{insightTenant.domain}</Text>
            <Text mt={1}>
              <strong>Industry:</strong> {insightTenant.industry}{" "}
              {insightTenant.industry === "Other" && insightTenant.industryOther
                ? `(${insightTenant.industryOther})`
                : ""}
            </Text>
            <Text mt={1}>
              <strong>Website:</strong> {insightTenant.companyWebsite}
            </Text>
          </Box>
        </Flex>

        {/* Tabbed Layout for Detailed Insights */}
        <Tabs variant="enclosed" isFitted>
          <TabList mb="1em">
            <Tab>Usage & Engagement</Tab>
            <Tab>Billing & Payment</Tab>
            <Tab>Security & Compliance</Tab>
          </TabList>
          <TabPanels>
            {/* 1. Usage & Engagement */}
            <TabPanel>
              <Flex direction="column" gap={3}>
                <Text>
                  <strong>Total Users:</strong> {insightTenant.userCount || "N/A"}
                </Text>
                <Text>
                  <strong>Active Users:</strong> {insightTenant.activeUserCount || "N/A"}
                </Text>
                <Text>
                  <strong>Recent Logins:</strong>{" "}
                  {insightTenant.lastLogin
                    ? new Date(insightTenant.lastLogin).toLocaleString()
                    : "N/A"}
                </Text>
                <Text>
                  <strong>Engagement Score:</strong>{" "}
                  {insightTenant.engagementScore || "Not calculated"}
                </Text>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                  <Text color="gray.500" textAlign="center">
                    Interactive Engagement Chart [Placeholder]
                  </Text>
                </Box>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                  <Text fontWeight="bold" mb={2}>Activity Timeline</Text>
                  {insightTenant.activityTimeline && insightTenant.activityTimeline.length > 0 ? (
                    insightTenant.activityTimeline.map((event, index) => (
                      <Text key={index}>
                        {new Date(event.timestamp).toLocaleString()} - {event.description}
                      </Text>
                    ))
                  ) : (
                    <Text color="gray.500">
                      <em>No recent activity available.</em>
                    </Text>
                  )}
                </Box>
              </Flex>
            </TabPanel>

            {/* 2. Billing & Payment */}
            <TabPanel>
              <Flex direction="column" gap={3}>
                <Text>
                  <strong>Subscription:</strong>{" "}
                  {insightTenant.subscription
                    ? insightTenant.subscription.subscriptionTier ||
                      insightTenant.subscription.name ||
                      "N/A"
                    : "None"}
                </Text>
                {insightTenant.subscription && (
                  <Box ml={4} mt={1} p={2} bg="gray.50" borderRadius="md">
                    <Text>
                      <strong>Price:</strong> ${insightTenant.subscription.price}
                    </Text>
                    <Text>
                      <strong>Duration:</strong> {insightTenant.subscription.duration}
                    </Text>
                    <Text>
                      <strong>Auto Renew:</strong>{" "}
                      {insightTenant.subscription.autoRenew ? "Yes" : "No"}
                    </Text>
                    <Text>
                      <strong>Renewal Date:</strong>{" "}
                      {insightTenant.subscription.renewalDate
                        ? new Date(insightTenant.subscription.renewalDate).toLocaleDateString()
                        : "N/A"}
                    </Text>
                    {insightTenant.subscription.trialPeriodDays && (
                      <Text>
                        <strong>Trial Period:</strong> {insightTenant.subscription.trialPeriodDays} days
                      </Text>
                    )}
                  </Box>
                )}
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                  <Text fontWeight="bold" mb={2}>Invoice History</Text>
                  {insightTenant.invoiceHistory && insightTenant.invoiceHistory.length > 0 ? (
                    insightTenant.invoiceHistory.map((invoice, index) => (
                      <Text key={index}>
                        {new Date(invoice.date).toLocaleDateString()}: ${invoice.amount} ({invoice.status})
                      </Text>
                    ))
                  ) : (
                    <Text color="gray.500">
                      <em>No invoice history available.</em>
                    </Text>
                  )}
                </Box>
                <Text>
                  <strong>Discounts / Credits:</strong>{" "}
                  {insightTenant.discounts ? insightTenant.discounts : "None"}
                </Text>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                  <Text color="gray.500" textAlign="center">
                    Subscription Trend Graph [Placeholder]
                  </Text>
                </Box>
                <Button colorScheme="blue" size="sm">
                  Export Billing Report
                </Button>
              </Flex>
            </TabPanel>

            {/* 3. Security & Compliance */}
            <TabPanel>
              <Flex direction="column" gap={3}>
                <Text>
                  <strong>MFA Enabled:</strong> {insightTenant.mfaEnabled ? "Yes" : "No"}
                </Text>
                {insightTenant.allowedMfa && insightTenant.allowedMfa.length > 0 && (
                  <Text>
                    <strong>Allowed MFA Methods:</strong> {insightTenant.allowedMfa.join(", ")}
                  </Text>
                )}
                <Text>
                  <strong>Audit Log Events (Last 30 days):</strong>{" "}
                  {insightTenant.auditEventCount || "0"}
                </Text>
                <Box borderWidth="1px" borderColor="gray.200" borderRadius="md" p={3}>
                  <Text fontWeight="bold" mb={2}>Recent Audit Logs</Text>
                  {insightTenant.recentAuditLogs && insightTenant.recentAuditLogs.length > 0 ? (
                    insightTenant.recentAuditLogs.map((log, index) => (
                      <Text key={index}>
                        {new Date(log.timestamp).toLocaleString()} - {log.event}
                      </Text>
                    ))
                  ) : (
                    <Text color="gray.500">
                      <em>No audit logs available.</em>
                    </Text>
                  )}
                </Box>
                <Box>
                  <Text>
                    <strong>Security Health Score:</strong>{" "}
                    {insightTenant.securityHealthScore || "N/A"}
                  </Text>
                </Box>
                <Box display="flex" alignItems="center" gap={2} mt={2}>
                  <Text>
                    <strong>Compliance Certifications:</strong>
                  </Text>
                  {/* Replace these placeholders with dynamic badges if available */}
                  <Box bg="green.100" px={2} py={1} borderRadius="md">
                    <Text fontSize="sm">GDPR</Text>
                  </Box>
                  <Box bg="green.100" px={2} py={1} borderRadius="md">
                    <Text fontSize="sm">SOC 2</Text>
                  </Box>
                  <Box bg="green.100" px={2} py={1} borderRadius="md">
                    <Text fontSize="sm">ISO 27001</Text>
                  </Box>
                </Box>
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>
        
        {/* Common Details Section */}
        <Box mt={4}>
          <Flex direction="column" gap={2}>
            <Text>
              <strong>Created At:</strong>{" "}
              {new Date(insightTenant.createdAt).toLocaleString()}
            </Text>
            <Text>
              <strong>Last Updated:</strong>{" "}
              {new Date(insightTenant.updatedAt).toLocaleString()}
            </Text>
          </Flex>
          <Box mt={4}>
            <Text fontWeight="bold" mb={2}>Billing Address</Text>
            <Text>
              {insightTenant.billingStreet}, {insightTenant.billingCity},{" "}
              {insightTenant.billingState} {insightTenant.billingZip},{" "}
              {insightTenant.billingCountry}
            </Text>
            <Text mt={1}>
              <strong>Billing Phone:</strong> {insightTenant.billingPhone}
            </Text>
          </Box>
        </Box>
      </ModalBody>
      <ModalFooter>
        <Button colorScheme="blue" onClick={onInsightClose}>
          Close
        </Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
)}


    </AdminLayout>
  );
};

export default TenantManagement;
