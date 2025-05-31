// src/pages/BillingManagement.jsx
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
import BillingFormModal from "../components/BillingFormModal";

const BillingManagement = () => {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingBilling, setEditingBilling] = useState(null);

  // Modal disclosure hooks for add and edit modals.
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

  // Fetch billing records from API when the component mounts.
  useEffect(() => {
    const fetchBillings = async () => {
      try {
        const response = await fetch("/api/billings");
        if (!response.ok) throw new Error("Failed to fetch billing records");
        const data = await response.json();
        setBillings(data);
      } catch (error) {
        console.error("Error fetching billings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillings();
  }, []);

  // Filter billing records by search term (e.g. company name or billing street).
  const filteredBillings = useMemo(() => {
    if (!searchTerm) return billings;
    return billings.filter(
      (billing) =>
        (billing.companyName &&
          billing.companyName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (billing.billingStreet &&
          billing.billingStreet.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [billings, searchTerm]);

  // Handler to add a new billing record.
  const handleAddBilling = (newBilling) => {
    setBillings([...billings, newBilling]);
    onAddClose();
  };

  // Handler to update an existing billing record.
  const handleEditBilling = (updatedBilling) => {
    setBillings(
      billings.map((billing) =>
        billing.id === updatedBilling.id ? updatedBilling : billing
      )
    );
    setEditingBilling(null);
    onEditClose();
  };

  // Handler to delete a billing record.
  const handleDeleteBilling = async (billingId) => {
    try {
      const response = await fetch(`/api/billings/${billingId}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete billing record");
      setBillings(billings.filter((billing) => billing.id !== billingId));
    } catch (error) {
      console.error("Error deleting billing record:", error);
    }
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="lg" mb={4}>
          Billing Management
        </Heading>
        <Text color="gray.600" mb={4}>
          Manage your billing details including company addresses and contact
          information.
        </Text>

        <Flex mb={4} alignItems="center">
          <Input
            placeholder="Search billings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="blue" onClick={onAddOpen}>
            Add Billing
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
                  <Th>Company Name</Th>
                  <Th>Street</Th>
                  <Th>City</Th>
                  <Th>State</Th>
                  <Th>Zip</Th>
                  <Th>Country</Th>
                  <Th>Phone</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredBillings.length === 0 ? (
                  <Tr>
                    <Td colSpan={8} textAlign="center">
                      No billing records found.
                    </Td>
                  </Tr>
                ) : (
                  filteredBillings.map((billing) => (
                    <Tr key={billing.id} _hover={{ bg: "gray.100" }}>
                      <Td>{billing.companyName}</Td>
                      <Td>{billing.billingStreet}</Td>
                      <Td>{billing.billingCity}</Td>
                      <Td>{billing.billingState}</Td>
                      <Td>{billing.billingZip}</Td>
                      <Td>{billing.billingCountry}</Td>
                      <Td>{billing.billingPhone}</Td>
                      <Td>
                        <Tooltip label="Edit Billing">
                          <IconButton
                            aria-label="Edit billing record"
                            icon={<EditIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => {
                              setEditingBilling(billing);
                              onEditOpen();
                            }}
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
      </Box>

      {/* Modal for Adding a Billing Record */}
      <BillingFormModal
        isOpen={isAddOpen}
        onClose={onAddClose}
        mode="add"
        onSubmit={handleAddBilling}
      />

      {/* Modal for Editing a Billing Record */}
      {editingBilling && (
        <BillingFormModal
          isOpen={isEditOpen}
          onClose={onEditClose}
          mode="edit"
          initialData={editingBilling}
          onSubmit={handleEditBilling}
        />
      )}
    </AdminLayout>
  );
};

export default BillingManagement;