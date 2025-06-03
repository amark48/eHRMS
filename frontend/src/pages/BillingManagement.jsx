import React, { useState, useEffect, useMemo } from "react";
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
  Select,
  Tooltip
} from "@chakra-ui/react";
import { AddIcon, EditIcon, DeleteIcon } from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import BillingFormModal from "../components/BillingFormModal";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

// Helper function to format dates (MM/DD/YYYY)
const formatDate = (dateString) => {
  const dt = new Date(dateString);
  return dt.toLocaleDateString();
};

const BillingManagement = () => {
  // ------------------- State Definitions -------------------
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter & Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Sorting state – we allow sorting by companyName (tenant), billingDate, or amount.
  const [sortKey, setSortKey] = useState("billingDate");
  const [sortDirection, setSortDirection] = useState("asc");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modal states for Add/Edit billing
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBilling, setEditingBilling] = useState(null);

  const toast = useToast();

  // ------------------- Data Fetching -------------------
  useEffect(() => {
    const fetchBillings = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/billings", {
          headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` }
        });
        if (!response.ok) throw new Error("Failed to fetch billing records");
        const data = await response.json();
        // Expecting each billing record to include an associated tenant (i.e. data[i].tenant.companyName)
        setBillings(data);
      } catch (err) {
        console.error("Error fetching billings:", err);
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
    };
    fetchBillings();
  }, [toast]);

  // ------------------- Global Metrics & Analytics -------------------
  const globalMetrics = useMemo(() => {
    const totalBillings = billings.length;
    const totalRevenue = billings.reduce((sum, billing) => sum + Number(billing.amount || 0), 0);
    const averageBilling = totalBillings ? totalRevenue / totalBillings : 0;
    return { totalBillings, totalRevenue, averageBilling };
  }, [billings]);

  // Revenue Trend Data – aggregate revenue by month (assuming billingDate exists)
  const revenueTrendData = useMemo(() => {
    const groups = {};
    billings.forEach(billing => {
      if (billing.billingDate) {
        const dt = new Date(billing.billingDate);
        const monthKey = dt.toLocaleString("default", { month: "short", year: "numeric" });
        groups[monthKey] = (groups[monthKey] || 0) + Number(billing.amount || 0);
      }
    });
    return Object.entries(groups).map(([month, revenue]) => ({ month, revenue }));
  }, [billings]);

  // ------------------- Filtering Logic -------------------
  const filteredBillings = useMemo(() => {
    return billings.filter(billing => {
      // Assume each billing record has an associated tenant with companyName.
      const tenantName = billing.tenant && billing.tenant.companyName
        ? billing.tenant.companyName.toLowerCase()
        : "";
      const matchesSearch = !searchTerm || tenantName.includes(searchTerm.toLowerCase());
      const billingDate = billing.billingDate ? new Date(billing.billingDate) : null;
      const fromDate = dateFrom ? new Date(dateFrom) : null;
      const toDate = dateTo ? new Date(dateTo) : null;
      const matchesFrom = fromDate ? (billingDate && billingDate >= fromDate) : true;
      const matchesTo = toDate ? (billingDate && billingDate <= toDate) : true;
      return matchesSearch && matchesFrom && matchesTo;
    });
  }, [billings, searchTerm, dateFrom, dateTo]);

  // ------------------- Sorting Logic -------------------
  const sortedBillings = useMemo(() => {
    const data = [...filteredBillings];
    data.sort((a, b) => {
      let aValue, bValue;
      if (sortKey === "companyName") {
        // Sort by tenant's company name
        aValue = a.tenant && a.tenant.companyName ? a.tenant.companyName.toLowerCase() : "";
        bValue = b.tenant && b.tenant.companyName ? b.tenant.companyName.toLowerCase() : "";
      } else if (sortKey === "billingDate") {
        aValue = new Date(a.billingDate);
        bValue = new Date(b.billingDate);
      } else {
        // sortKey === "amount"
        aValue = Number(a.amount);
        bValue = Number(b.amount);
      }
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [filteredBillings, sortKey, sortDirection]);

  // ------------------- Pagination -------------------
  const totalPages = Math.ceil(sortedBillings.length / pageSize);
  const paginatedBillings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedBillings.slice(start, start + pageSize);
  }, [sortedBillings, currentPage]);

  // ------------------- Handler Functions -------------------
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  // Open modal for add or edit; for adding, editingBilling is null.
  const openEditModal = (billing) => {
    setEditingBilling(billing);
    setIsModalOpen(true);
  };
  const openAddModal = () => {
    setEditingBilling(null);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setEditingBilling(null);
    setIsModalOpen(false);
  };

  const handleDeleteBilling = async (billingId) => {
    try {
      const response = await fetch(`/api/billings/${billingId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete billing record");
      setBillings(prev => prev.filter(billing => billing.id !== billingId));
      toast({
        title: "Deleted",
        description: "Billing record deleted successfully.",
        status: "success",
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      console.error("Error deleting billing record:", error);
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true
      });
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage > 0 && newPage <= totalPages) setCurrentPage(newPage);
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading mb={4}>Billing Management</Heading>
        <Text color="gray.600" mb={4}>
          Manage your billing transactions. Tenant address and company details are maintained in the Tenant record.
        </Text>

        {/* Reports & Analytics Section */}
        <Box mb={6} p={4} borderWidth={1} borderRadius="md" boxShadow="sm">
          <Heading as="h3" size="md" mb={4}>
            Reports & Analytics
          </Heading>
          <Flex direction={{ base: "column", md: "row" }} gap={6}>
            <Box flex="1" textAlign="center">
              <Text fontSize="sm" color="gray.500">Total Billings</Text>
              <Text fontSize="2xl" fontWeight="bold">{globalMetrics.totalBillings}</Text>
            </Box>
            <Box flex="1" textAlign="center">
              <Text fontSize="sm" color="gray.500">Total Revenue ($)</Text>
              <Text fontSize="2xl" fontWeight="bold">{globalMetrics.totalRevenue.toFixed(2)}</Text>
            </Box>
            <Box flex="1" textAlign="center">
              <Text fontSize="sm" color="gray.500">Average Billing ($)</Text>
              <Text fontSize="2xl" fontWeight="bold">{globalMetrics.averageBilling.toFixed(2)}</Text>
            </Box>
          </Flex>
          <Box mt={6} height={250}>
            <Text fontSize="md" textAlign="center" fontWeight="semibold" mb={2}>
              Revenue Trend by Month
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <RechartsTooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3182ce" />
              </LineChart>
            </ResponsiveContainer>
          </Box>
        </Box>

        {/* Filters & Add Billing Button in a Single Row */}
        <Flex mb={4} align="center" justify="space-between" flexWrap="nowrap">
          <Flex gap={2} flex="1" overflowX="auto">
            <Input
              placeholder="Search by Tenant Name..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              maxW="220px"
            />
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              maxW="150px"
            />
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              maxW="150px"
            />
          </Flex>
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={openAddModal} ml={4}>
            Add Billing
          </Button>
        </Flex>

        {/* Billing Table */}
        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th onClick={() => handleSort("companyName")} cursor="pointer">
                    Tenant {sortKey === "companyName" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Th>
                  <Th onClick={() => handleSort("billingDate")} cursor="pointer">
                    Billing Date {sortKey === "billingDate" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Th>
                  <Th onClick={() => handleSort("amount")} cursor="pointer">
                    Amount {sortKey === "amount" && (sortDirection === "asc" ? "↑" : "↓")}
                  </Th>
                  <Th>Payment Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {sortedBillings.length === 0 ? (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      No billing records found.
                    </Td>
                  </Tr>
                ) : (
                  paginatedBillings.map((billing) => (
                    <Tr key={billing.id} _hover={{ bg: "gray.100" }}>
                      <Td>
                        {billing.tenant && billing.tenant.name ? billing.tenant.name : billing.tenantId}
                      </Td>
                      <Td>{billing.billingDate ? formatDate(billing.billingDate) : "-"}</Td>
                      <Td>${billing.amount ? Number(billing.amount).toFixed(2) : "-"}</Td>
                      <Td>{billing.isPaid ? "Paid" : "Pending"}</Td>
                      <Td>
                        <Tooltip label="Edit Billing">
                          <IconButton
                            aria-label="Edit billing record"
                            icon={<EditIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => openEditModal(billing)}
                          />
                        </Tooltip>
                        <Tooltip label="Delete Billing">
                          <IconButton
                            aria-label="Delete billing record"
                            icon={<DeleteIcon />}
                            size="sm"
                            onClick={() => handleDeleteBilling(billing.id)}
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

        {/* Pagination Controls */}
        <Flex mt={4} justify="space-between" align="center" flexWrap="nowrap">
          <Button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            Previous
          </Button>
          <Text>
            Page {currentPage} of {totalPages || 1}
          </Text>
          <Button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}>
            Next
          </Button>
          <Flex align="center" gap={2}>
            <Text>Jump to Page:</Text>
            <Input
              type="number"
              size="sm"
              maxW="60px"
              onChange={(e) => {
                const page = Number(e.target.value);
                if (page > 0 && page <= totalPages) setCurrentPage(page);
              }}
            />
          </Flex>
        </Flex>
      </Box>

      {/* Billing Form Modal for Add/Edit */}
      <BillingFormModal
  isOpen={isModalOpen}
  onClose={closeModal}
  mode={editingBilling ? "edit" : "add"}
  initialData={editingBilling}
  onSubmit={
    editingBilling
      ? async (updatedBilling) => {
          try {
            const response = await fetch(`/api/billings/${updatedBilling.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
              body: JSON.stringify(updatedBilling),
            });
            if (!response.ok)
              throw new Error("Failed to update billing record");
            const updatedRecord = await response.json();
            setBillings((prev) =>
              prev.map((b) => (b.id === updatedRecord.id ? updatedRecord : b))
            );
            toast({
              title: "Billing updated",
              description: "Billing record updated successfully.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            closeModal();
          } catch (error) {
            toast({
              title: "Error",
              description: error.message,
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        }
      : async (newBilling) => {
          try {
            const response = await fetch("/api/billings", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("authToken")}`,
              },
              body: JSON.stringify(newBilling),
            });
            if (!response.ok)
              throw new Error("Failed to create billing record");
            const createdBilling = await response.json();
            setBillings((prev) => [...prev, createdBilling]);
            toast({
              title: "Billing added",
              description: "Billing record added successfully.",
              status: "success",
              duration: 3000,
              isClosable: true,
            });
            closeModal();
          } catch (error) {
            toast({
              title: "Error",
              description: error.message,
              status: "error",
              duration: 3000,
              isClosable: true,
            });
          }
        }
  }
/>
    </AdminLayout>
  );
};

export default BillingManagement;
