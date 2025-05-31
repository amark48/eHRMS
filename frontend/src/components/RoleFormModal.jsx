// src/components/RoleFormModal.jsx
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
  VStack,
  Textarea,
} from "@chakra-ui/react";

const RoleFormModal = ({ isOpen, onClose, mode, initialData, onSubmit }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      // If permissions come as an array, join them into a comma-separated string.
      if (Array.isArray(initialData.permissions)) {
        setPermissions(initialData.permissions.join(", "));
      } else {
        setPermissions(initialData.permissions || "");
      }
    } else {
      setName("");
      setDescription("");
      setPermissions("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Convert the comma-separated permissions string into an array.
    const permissionsArray = permissions
      .split(",")
      .map((perm) => perm.trim())
      .filter((perm) => perm.length > 0);

    const roleData = { name, description, permissions: permissionsArray };
    onSubmit(roleData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>
          {mode === "edit" ? "Edit Role" : "Create New Role"}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl id="roleName" isRequired>
              <FormLabel>Role Name</FormLabel>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter role name"
              />
            </FormControl>
            <FormControl id="roleDescription">
              <FormLabel>Description</FormLabel>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter role description"
              />
            </FormControl>
            <FormControl id="rolePermissions">
              <FormLabel>Permissions</FormLabel>
              <Textarea
                value={permissions}
                onChange={(e) => setPermissions(e.target.value)}
                placeholder="Enter comma separated permissions (e.g. create_user, delete_user, manage_tenant)"
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

export default RoleFormModal;