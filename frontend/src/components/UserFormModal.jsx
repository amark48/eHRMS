import React, { useState, useEffect } from "react";
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter,
  Button, FormControl, FormLabel, Input, VStack, Select, Switch, Avatar, Box, Spinner
} from "@chakra-ui/react";

//
const UserFormModal = ({ isOpen, onClose, mode, initialData, onSubmit, tenants, onUserUpdated = () => {} }) => {
  const [tenantId, setTenantId] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaType, setMfaType] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null); // For displaying profile picture preview
  const [isActive, setIsActive] = useState(true);
  const [availableMfaTypes, setAvailableMfaTypes] = useState([]);
  const [formDisabled, setFormDisabled] = useState(true); // Disable fields until tenant selection

useEffect(() => {
  if (mode === "edit" && initialData) {
    console.log("[DEBUG] Initializing form with existing user data:", initialData);
    setTenantId(initialData.tenant ? initialData.tenant.id : "");
    setFirstName(initialData.firstName || "");
    setLastName(initialData.lastName || "");
    setEmail(initialData.email || ""); 
    setMfaEnabled(initialData.mfaEnabled || false);
    setMfaType(initialData.mfaType || "");
    setProfilePicture(initialData.avatar || null);
    setRoleId(initialData.role ? initialData.role.id : "");
    setIsActive(initialData.isActive ?? true);
    setFormDisabled(false); // Enable form fields for editing
  } else if (mode === "add") {
    console.log("[DEBUG] Resetting form for new user creation");
    setTenantId("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setMfaEnabled(false);
    setMfaType("");
    setProfilePicture(null);
    setRoleId("");
    setIsActive(true);
    setFormDisabled(true); // Keep fields disabled until tenant is selected
  }
}, [initialData, mode]);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("authToken");
        console.log("[DEBUG] Fetching roles from /api/roles using token:", token);
        if (!token) {
          console.error("[ERROR] No token found, skipping fetch of roles");
          setLoadingRoles(false);
          return;
        }

        const response = await fetch("/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("[DEBUG] Roles fetched successfully:", data);
        setRoles(data);
      } catch (error) {
        console.error("[ERROR] Fetching roles failed:", error.message);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

const handleTenantChange = (selectedTenantId) => {
  console.log("[DEBUG] Tenant selected:", selectedTenantId);
  setTenantId(selectedTenantId);
  
  // Enable the rest of the form
  setFormDisabled(false);

  // Restrict MFA types based on the selected tenant
  const selectedTenant = tenants.find((tenant) => tenant.id === selectedTenantId);

  if (selectedTenant) {
    setAvailableMfaTypes(selectedTenant.allowedMfaTypes || []);
    setMfaType(""); 
    setMfaEnabled(selectedTenant.allowedMfaTypes.length > 0);
  }
};

const handleProfileUpload = (event) => {
  const file = event.target.files[0];
  console.log("[DEBUG] Profile picture upload event triggered:", file);

  if (file) {
    setProfilePicture(file); // ✅ Store the actual file for upload
    setPreview(URL.createObjectURL(file)); // ✅ Store the preview for display
  }
};

// UserFormModal.jsx

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("firstName", firstName);
  formData.append("lastName", lastName);
  formData.append("roleId", roleId);
  formData.append("mfaEnabled", mfaEnabled);
  formData.append("mfaType", mfaEnabled ? mfaType : "");
  formData.append("isActive", isActive);

  if (profilePicture instanceof File) {
    formData.append("avatar", profilePicture);
  }

  try {
    const token = localStorage.getItem("authToken");
    const url = mode === "edit"
      ? `${API_BASE}/api/users/${initialData.id}`
      : `${API_BASE}/api/users`;

    const res = await fetch(url, {
      method: mode === "edit" ? "PUT" : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const payload = await res.json();
    if (!res.ok) throw new Error(payload.message || "Save failed");

    console.log("[DEBUG] User updated successfully:", payload);

    // ✅ Update profile picture state to trigger React re-render
    setProfilePicture(payload.user.avatar);
    // tell the parent “here’s your updated user object”
    onSubmit(payload.user);

    onClose();
  } catch (err) {
    console.error("[ERROR] Failed to save user:", err);
  }
};

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{mode === "edit" ? "Edit User" : "Create New User"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl id="tenant" isRequired>
              <FormLabel>Select Tenant</FormLabel>
              <Select
                placeholder="Select Tenant"
                value={tenantId}
                onChange={(e) => handleTenantChange(e.target.value)}
                isDisabled={mode === "edit"}
              >
                {tenants.filter((tenant) => tenant.isActive).map((tenant) => (
                  <option key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl id="firstName" isRequired isDisabled={formDisabled}>
              <FormLabel>First Name</FormLabel>
              <Input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </FormControl>

            <FormControl id="lastName" isRequired isDisabled={formDisabled}>
              <FormLabel>Last Name</FormLabel>
              <Input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </FormControl>

            <FormControl id="email" isRequired>
              <FormLabel>Email</FormLabel>
              <Input type="email" value={email} isReadOnly={mode === "edit"} />
            </FormControl>

            <FormControl id="role" isRequired isDisabled={formDisabled}>
              <FormLabel>Role</FormLabel>
              {loadingRoles ? (
                <Spinner size="sm" />
              ) : (
                <Select placeholder="Select Role" value={roleId} onChange={(e) => setRoleId(e.target.value)}>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>

            <FormControl id="mfaEnabled" isDisabled={formDisabled}>
              <FormLabel>Enable MFA</FormLabel>
              <Switch
                isChecked={mfaEnabled}
                onChange={(e) => setMfaEnabled(e.target.checked)}
                isDisabled={availableMfaTypes.length === 0}
              />
            </FormControl>

            {mfaEnabled && availableMfaTypes.length > 0 && (
              <FormControl id="mfaType" isDisabled={formDisabled}>
                <FormLabel>Select MFA Type</FormLabel>
                <Select
                  placeholder="Select MFA Type"
                  value={mfaType}
                  onChange={(e) => setMfaType(e.target.value)}
                >
                  {availableMfaTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </FormControl>
            )}

            <FormControl id="profilePicture" isDisabled={formDisabled}>
              <FormLabel>Profile Picture</FormLabel>
              <Box display="flex" alignItems="center" gap={4}>
                <Avatar
                  size="md"
                  src={preview || (typeof profilePicture === "string" ? profilePicture : undefined)}
                  name={`${firstName} ${lastName}`}
                />
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleProfileUpload}
                  disabled={formDisabled}
                  p={1}
                />
              </Box>
            </FormControl>

            <FormControl id="isActive" isDisabled={formDisabled}>
              <FormLabel>User Active</FormLabel>
              <Switch isChecked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
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

export default UserFormModal;