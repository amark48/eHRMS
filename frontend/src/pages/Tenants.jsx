// src/pages/Tenants.jsx
import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  Box,
  Heading,
  Text,
  Table,
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
  Spacer,
  useDisclosure,
  useToast,
  Avatar,
  Tooltip,
  Spinner,
  Select,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
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
} from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import TenantFormModal from "../components/TenantFormModal";

// Custom debounce hook.
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Tenants = () => {
 
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const toast = useToast();

  const { isOpen, onOpen, onClose } = useDisclosure();
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // Adjust if needed

  // Sorting state: column and order.
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  const [statusFilter, setStatusFilter] = useState("");

  // For delete confirmation.
  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const cancelRef = useRef();

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

  // Debounce the searchTerm for performance.
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch tenants from backend.
  const fetchTenants = async () => {
    try {
      const response = await fetch("/api/tenants");
      if (!response.ok) {
        throw new Error("Failed to fetch tenants");
      }
      const data = await response.json();
      setTenants(data);
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

  useEffect(() => {
    fetchTenants();
  }, []);

  // Derived state: filtered and sorted tenants.
 const filteredAndSortedTenants = useMemo(() => {
  // First, filter by search term.
  let filtered = debouncedSearchTerm
    ? tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
          tenant.domain.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      )
    : tenants;

  // Apply the status filter.
  if (statusFilter) {
    if (statusFilter === "active") {
      filtered = filtered.filter((tenant) => tenant.isActive);
    } else if (statusFilter === "disabled") {
      filtered = filtered.filter((tenant) => !tenant.isActive);
    }
  }

  // Create a shallow copy so we don't mutate state.
  const sorted = [...filtered];

  // Sorting logic.
  if (sortConfig !== null) {
    sorted.sort((a, b) => {
      if (sortConfig.key === "createdAt") {
        // Compare as dates.
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return sortConfig.direction === "asc"
          ? dateA - dateB
          : dateB - dateA;
      }
      // For string comparison (e.g., name).
      if (!a[sortConfig.key] || !b[sortConfig.key]) return 0;
      const aKey = a[sortConfig.key].toString().toLowerCase();
      const bKey = b[sortConfig.key].toString().toLowerCase();
      if (aKey < bKey) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aKey > bKey) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  }
  return sorted;
}, [tenants, debouncedSearchTerm, sortConfig, statusFilter]);

  // Pagination: Compute total pages and current page data.
  const totalPages = Math.ceil(filteredAndSortedTenants.length / pageSize);
  const paginatedTenants = useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
      return filteredAndSortedTenants.slice(0, pageSize);
    }
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredAndSortedTenants.slice(startIndex, endIndex);
  }, [filteredAndSortedTenants, currentPage, pageSize, totalPages]);

  // Sorting handler.
  const handleSort = (key) => {
    setSortConfig((prevConfig) => {
      if (prevConfig.key === key) {
        // Toggle order.
        return { key, direction: prevConfig.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // Toggle tenant active status.
  const handleToggleTenantStatus = async (tenantId) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/toggle`, { method: "PATCH" });
      if (!response.ok) throw new Error("Error toggling tenant status");
      const updatedTenant = await response.json();
      setTenants((prev) =>
        prev.map((tenant) => (tenant.id === tenantId ? updatedTenant : tenant))
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

  // Delete tenant with confirmation.
  const handleDeleteTenantConfirm = async () => {
    if (!tenantToDelete) return;
    try {
      const response = await fetch(`/api/tenants/${tenantToDelete.id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Error deleting tenant");
      setTenants((prev) => prev.filter((tenant) => tenant.id !== tenantToDelete.id));
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

  const openDeleteDialog = (tenant) => {
    setTenantToDelete(tenant);
    onDeleteOpen();
  };

  // Add new tenant.
  const handleAddTenant = (tenantData) => {
  // tenantData is expected to be the result from the modal's API call.
  setTenants((prev) => [...prev, tenantData]);
  toast({
    title: "Tenant added successfully",
    status: "success",
    duration: 3000,
    isClosable: true,
  });
  onAddClose();
};

  // Edit an existing tenant.
  const handleEditTenant = async (tenantData) => {
    try {
      const response = await fetch(`/api/tenants/${editingTenant.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenantData),
      });
      if (!response.ok) throw new Error("Error updating tenant");
      const updatedTenant = await response.json();
      setTenants((prev) =>
        prev.map((t) => (t.id === editingTenant.id ? updatedTenant : t))
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

  return (
    <AdminLayout>
      <Box p={6}>
        <Flex mb={4} alignItems="center">
          <Heading size="lg">Tenant Management</Heading>
          <Spacer />
          <Button
  leftIcon={<AddIcon />}
  colorScheme="blue"
  onClick={() => {
    console.log("Add Tenant button clicked");
    onAddOpen();
  }}
>
  Add Tenant
</Button>
        </Flex>
<Flex justify="center" alignItems="center" mb={4}>
  <InputGroup maxW="300px">
    <InputLeftElement pointerEvents="none">
      <SearchIcon color="gray.400" />
    </InputLeftElement>
    <Input
      placeholder="Search..."
      size="sm"
      value={searchTerm}
      onChange={(e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset page on search change.
      }}
    />
  </InputGroup>
  <Spacer />
  <Select
    placeholder="Filter by status"
    size="sm"
    maxW="200px"
    ml={4}
    value={statusFilter}
    onChange={(e) => {
      setStatusFilter(e.target.value);
      setCurrentPage(1); // Reset page when filter changes.
    }}
  >
    <option value="active">Active</option>
    <option value="disabled">Disabled</option>
  </Select>
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
                    <Th>Logo</Th>
                    <Th cursor="pointer" onClick={() => handleSort("name")}>
                      Name{" "}
                      {sortConfig.key === "name" &&
                        (sortConfig.direction === "asc" ? (
                          <TriangleUpIcon ml={1} />
                        ) : (
                          <TriangleDownIcon ml={1} />
                        ))}
                    </Th>
                    <Th>Domain</Th>
                    <Th>Subscription Tier</Th>
                    <Th>Status</Th>
                    <Th cursor="pointer" onClick={() => handleSort("createdAt")}>
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
                          <Avatar src={tenant.logoUrl} name={tenant.name} />
                        </Td>
                        <Td>{tenant.name}</Td>
                        <Td>{tenant.domain}</Td>
                        <Td>{tenant.subscriptionTier}</Td>
                        <Td>{tenant.isActive ? "Active" : "Disabled"}</Td>
                        <Td>
                          {tenant.createdAt
                            ? new Date(tenant.createdAt).toLocaleString()
                            : "N/A"}
                        </Td>
                        <Td isNumeric>
                          <Tooltip label="Edit Tenant" aria-label="Edit tooltip">
                            <IconButton
                              aria-label="Edit tenant"
                              icon={<EditIcon />}
                              mr={2}
                              onClick={() => {
                                setEditingTenant(tenant);
                                onEditOpen();
                              }}
                            />
                          </Tooltip>
                          <Tooltip label="Delete Tenant" aria-label="Delete tooltip">
                            <IconButton
                              aria-label="Delete tenant"
                              icon={<DeleteIcon />}
                              mr={2}
                              onClick={() => {
                                setEditingTenant(null);
                                openDeleteDialog(tenant);
                              }}
                            />
                          </Tooltip>
                          <Tooltip
                            label={tenant.isActive ? "Disable Tenant" : "Enable Tenant"}
                            aria-label="Toggle tooltip"
                          >
                            <IconButton
                              aria-label={tenant.isActive ? "Disable tenant" : "Enable tenant"}
                              icon={tenant.isActive ? <LockIcon /> : <UnlockIcon />}
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
            {/* Pagination Controls */}
            <Flex justify="space-between" align="center" mt={4}>
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
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
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
        onClose={onAddClose}
        mode="add"
        onSubmit={handleAddTenant}
      />



      {/* Edit Tenant Modal */}
      {editingTenant && (
        <TenantFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          mode="edit"
          initialData={editingTenant}
          onSubmit={handleEditTenant}
        />
      )}
    </AdminLayout>
  );
};

export default Tenants;