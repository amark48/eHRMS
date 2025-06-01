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
  // States for tenants list, search and filter.
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  // Status filter: use "" for All, "active" for active only, "disabled" for disabled only.
  const [statusFilter, setStatusFilter] = useState("");

  const [loading, setLoading] = useState(true);
  const [editingTenant, setEditingTenant] = useState(null);
  const toast = useToast();

  // Chakra disclosure hooks for modals.
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [tenantToDelete, setTenantToDelete] = useState(null);
  const cancelRef = useRef();

  // Pagination state.
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Sorting state.
  const [sortConfig, setSortConfig] = useState({ key: "name", direction: "asc" });

  // Debounce the search term for performance.
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

  // Filter the tenants by search term and status.
  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const termMatch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase());
      let statusMatch = true;
      if (statusFilter === "active") {
        statusMatch = tenant.isActive;
      } else if (statusFilter === "disabled") {
        statusMatch = !tenant.isActive;
      }
      return termMatch && statusMatch;
    });
  }, [tenants, searchTerm, statusFilter]);

  // Sorting
  const filteredAndSortedTenants = useMemo(() => {
    const sorted = [...filteredTenants];
    if (sortConfig !== null) {
      sorted.sort((a, b) => {
        if (sortConfig.key === "createdAt") {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }
        const aKey = a[sortConfig.key]?.toString().toLowerCase() || "";
        const bKey = b[sortConfig.key]?.toString().toLowerCase() || "";
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
  }, [filteredTenants, sortConfig]);

  // Pagination.
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

  // Handlers for tenant status toggling, deletion, add, and edit.
  const handleToggleTenantStatus = async (tenantId) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/toggle`, {
        method: "PATCH",
      });
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

  const openDeleteDialog = (tenant) => {
    setTenantToDelete(tenant);
    onDeleteOpen();
  };

  const handleDeleteTenantConfirm = async () => {
    if (!tenantToDelete) return;
    try {
      const response = await fetch(`/api/tenants/${tenantToDelete.id}`, {
        method: "DELETE",
      });
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

  const handleAddTenant = (tenantData) => {
    setTenants((prev) => [...prev, tenantData]);
    toast({
      title: "Tenant added successfully",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    onAddClose();
  };

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
        <Heading mb={4}>Tenant Management</Heading>
        <Text color="gray.600" mb={6}>
          Manage your tenant configurations.
        </Text>
        {/* Header: Search and Filter on the left, Add Tenant on the right */}
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
                        (sortConfig.direction === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
                    </Th>
                    <Th>Domain</Th>
                    <Th>Subscription Tier</Th>
                    <Th>Status</Th>
                    <Th
                      cursor="pointer"
                      onClick={() => handleSort("createdAt")}
                    >
                      Created At{" "}
                      {sortConfig.key === "createdAt" &&
                        (sortConfig.direction === "asc" ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />)}
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
                        <Td>{tenant.subscriptionTier}</Td>
                        <Td>{tenant.isActive ? "Active" : "Disabled"}</Td>
                        <Td>{tenant.createdAt ? new Date(tenant.createdAt).toLocaleString() : "N/A"}</Td>
                        <Td isNumeric>
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
              Are you sure you want to delete the tenant <strong>{tenantToDelete?.name}</strong>? This action cannot be undone.
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
    </AdminLayout>
  );
};

export default Tenants;
