// src/components/UserFormModal.jsx

import React, { useState, useEffect, useMemo } from "react";
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
  InputGroup,
  InputRightAddon,
  VStack,
  Select,
  Switch,
  Avatar,
  Box,
  Spinner,
  useToast,
  CheckboxGroup,
  Checkbox,
  VStack as CheckboxVStack,
} from "@chakra-ui/react";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Helper function to generate a strong password.
function generateStrongPassword(length = 12) {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  let password = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }
  return password;
}

const UserFormModal = ({
  isOpen,
  onClose,
  mode, // "add" or "edit"
  initialData,
  onSubmit,
  tenants,
  onUserUpdated = () => {},
}) => {
  const toast = useToast();

  // Retrieve current user from localStorage.
  const currentUser = useMemo(() => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  }, []);

  // Determine if the current user is SuperAdmin.
  const userIsSuperAdmin = currentUser?.role?.name === "SuperAdmin";

  // Local state for form fields.
  const [tenantId, setTenantId] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [roles, setRoles] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [localEmail, setLocalEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaType, setMfaType] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null); // file object or URL
  const [preview, setPreview] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [formDisabled, setFormDisabled] = useState(true);
  const [password, setPassword] = useState("");

  // Fetch available roles.
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const res = await fetch(`${API_BASE}/api/roles`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch roles");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("[ERROR] Fetch roles:", err);
      } finally {
        setLoadingRoles(false);
      }
    };
    fetchRoles();
  }, []);

  // Form initialization effect.
  useEffect(() => {
    if (mode === "edit" && initialData) {
      console.log("[DEBUG] Initializing form (edit mode) with data:", initialData);
      const tenantObj = initialData.tenant || {};
      setTenantId(tenantObj.id || "");
      setTenantName(tenantObj.name || "");
      setFirstName(initialData.firstName || "");
      setLastName(initialData.lastName || "");
      setEmail(initialData.email || "");
      setMfaEnabled(initialData.mfaEnabled || false);
      if (initialData.mfaType) {
        setMfaType(Array.isArray(initialData.mfaType) ? initialData.mfaType : [initialData.mfaType]);
      } else {
        setMfaType([]);
      }
      const avatarUrl =
        initialData.avatar &&
        (initialData.avatar.includes("placeholder") ||
          initialData.avatar.includes("via.placeholder.com"))
          ? null
          : initialData.avatar;
      setProfilePicture(avatarUrl);
      setRoleId(initialData.role ? initialData.role.id : "");
      setIsActive(currentUser?.role?.name === "SuperAdmin" ? true : (initialData.isActive ?? true));
      setFormDisabled(false);
    } else if (mode === "add") {
      console.log("[DEBUG] Initializing form (add mode)");
      if (currentUser && !userIsSuperAdmin) {
        setTenantId(currentUser.tenantId);
        const foundTenant = tenants.find((t) => t.id === currentUser.tenantId);
        setTenantName(foundTenant ? foundTenant.name : "");
        setFormDisabled(false);
      } else {
        setTenantId("");
        setTenantName("");
        setFormDisabled(true);
      }
      setFirstName("");
      setLastName("");
      setEmail("");
      setLocalEmail("");
      setMfaEnabled(false);
      setMfaType([]);
      setProfilePicture(null);
      setRoleId("");
      setIsActive(true);
      setPreview(null);
      setPassword(generateStrongPassword());
    }
    // Note: 'tenants' is intentionally excluded to avoid reinitializing when the tenant list changes.
  }, [initialData, mode, currentUser, userIsSuperAdmin]);

  // --- Allowed MFA Options based on selected tenant ---
  // Checks the tenant for enabledMfaTypes, allowedMfaTypes, or allowedMfa.
  const allowedMfaOptions = useMemo(() => {
    const tenant = tenants.find((t) => t.id === tenantId);
    console.log("[DEBUG] allowedMfaOptions - tenant:", tenant);
    if (tenant) {
      let mfaOptions =
        tenant.enabledMfaTypes || tenant.allowedMfaTypes || tenant.allowedMfa;
      if (mfaOptions) {
        return Array.isArray(mfaOptions) ? mfaOptions : [mfaOptions];
      }
    }
    return [];
  }, [tenantId, tenants]);

  // --- Tenant Selection using an Input with datalist for searchability ---
  const handleTenantNameChange = (e) => {
    const value = e.target.value;
    setTenantName(value);
    const found = tenants.find(
      (tenant) => tenant.name.toLowerCase() === value.toLowerCase()
    );
    if (found) {
      setTenantId(found.id);
    } else {
      setTenantId("");
    }
    setFormDisabled(false);
  };

  // Handler for avatar file input.
  const handleProfileUpload = (event) => {
    const file = event.target.files[0];
    console.log("[DEBUG] Selected avatar file:", file);
    if (file) {
      setProfilePicture(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Upload avatar and return the URL.
  const handleAvatarUpload = async () => {
    if (!profilePicture || !tenantId) return null;
    const formData = new FormData();
    formData.append("avatar", profilePicture);
    try {
      const response = await fetch(`${API_BASE}/upload-avatar/${tenantId}/avatar`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Avatar upload failed");
      console.log("[DEBUG] Avatar uploaded. URL:", data.avatarUrl);
      return data.avatarUrl;
    } catch (error) {
      console.error("[ERROR] Avatar upload error:", error);
      toast({
        title: "Avatar Upload Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return null;
    }
  };

  // Form submission handler.
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("[DEBUG] Submitting form with tenantId:", tenantId);
    if (mode === "add" && !tenantId) {
      toast({
        title: "Tenant not selected",
        description: "Please select a tenant before saving the user.",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
      return;
    }
    const token = localStorage.getItem("authToken");
    const formDataToSend = new FormData();
    let avatarUrl = null;
    if (profilePicture) {
      avatarUrl = await handleAvatarUpload();
    }
    formDataToSend.append("tenantId", tenantId);
    formDataToSend.append("firstName", firstName);
    formDataToSend.append("lastName", lastName);
    formDataToSend.append("roleId", roleId);
    formDataToSend.append("mfaEnabled", mfaEnabled);
    formDataToSend.append("mfaType", JSON.stringify(mfaType));
    formDataToSend.append("isActive", isActive);
    if (mode === "add") {
      const currentTenant = tenants.find((t) => t.id === tenantId);
      const domain = currentTenant ? currentTenant.domain : "";
      const fullEmail = localEmail.trim() + "@" + domain;
      formDataToSend.append("email", fullEmail);
      formDataToSend.append("password", password);
    } else {
      formDataToSend.append("email", email);
    }
    if (avatarUrl) {
      formDataToSend.append("avatar", avatarUrl);
    }
    try {
      const url =
        mode === "edit"
          ? `${API_BASE}/api/users/${initialData.id}`
          : `${API_BASE}/api/users`;
      const res = await fetch(url, {
        method: mode === "edit" ? "PUT" : "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataToSend,
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.message || "Save failed");
      toast({
        title: "User Saved",
        description: "User updated successfully!",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      console.log("[DEBUG] User created/updated:", payload.user);
      onSubmit(payload.user);
      onClose();
    } catch (err) {
      console.error("[ERROR] Failed to save user:", err);
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
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent as="form" onSubmit={handleSubmit}>
        <ModalHeader>{mode === "edit" ? "Edit User" : "Create New User"}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            {/* Tenant Selection using an Input with datalist */}
            <FormControl id="tenant" isRequired>
              <FormLabel>Select Tenant</FormLabel>
              <Input
                placeholder="Select Tenant"
                value={tenantName}
                onChange={handleTenantNameChange}
                list="tenant-options"
                isDisabled={!userIsSuperAdmin || mode === "edit"}
              />
              <datalist id="tenant-options">
                {tenants
                  .filter((tenant) => tenant.isActive)
                  .map((tenant) => (
                    <option key={tenant.id} value={tenant.name} />
                  ))}
              </datalist>
            </FormControl>

            {/* First Name */}
            <FormControl id="firstName" isRequired isDisabled={formDisabled}>
              <FormLabel>First Name</FormLabel>
              <Input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </FormControl>

            {/* Last Name */}
            <FormControl id="lastName" isRequired isDisabled={formDisabled}>
              <FormLabel>Last Name</FormLabel>
              <Input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </FormControl>

            {/* Email Field */}
            {mode === "add" && tenantId ? (
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <InputGroup>
                  <Input
                    type="text"
                    value={localEmail}
                    onChange={(e) => setLocalEmail(e.target.value)}
                    placeholder="Enter username"
                    isDisabled={formDisabled}
                  />
                  <InputRightAddon
                    children={`@${tenants.find((t) => t.id === tenantId)?.domain || ""}`}
                  />
                </InputGroup>
              </FormControl>
            ) : (
              <FormControl id="email" isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  value={email}
                  readOnly={mode === "edit"}
                  onChange={(e) => mode !== "edit" && setEmail(e.target.value)}
                />
              </FormControl>
            )}

            {/* Password Field (only in add mode) */}
            {mode === "add" && (
              <FormControl id="password" isRequired>
                <FormLabel>Password</FormLabel>
                <Input type="text" value={password} isReadOnly />
              </FormControl>
            )}

            {/* Role Selection */}
            <FormControl
              id="role"
              isRequired
              isDisabled={formDisabled || (!userIsSuperAdmin && mode === "add")}
            >
              <FormLabel>Role</FormLabel>
              {loadingRoles ? (
                <Spinner size="sm" />
              ) : (
                <Select
                  placeholder="Select Role"
                  value={roleId}
                  onChange={(e) => setRoleId(e.target.value)}
                >
                  <option value="">Select Role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </Select>
              )}
            </FormControl>

            {/* MFA Controls: Render only if allowed MFA options exist */}
            {allowedMfaOptions.length > 0 && (
              <>
                <FormControl id="mfaEnabled" isDisabled={formDisabled}>
                  <FormLabel>Enable MFA</FormLabel>
                  <Switch
                    isChecked={mfaEnabled}
                    onChange={(e) => setMfaEnabled(e.target.checked)}
                  />
                </FormControl>
                {mfaEnabled && (
                  <FormControl id="mfaType" isDisabled={formDisabled}>
                    <FormLabel>Select MFA Type(s)</FormLabel>
                    <CheckboxGroup value={mfaType} onChange={setMfaType}>
                      <CheckboxVStack align="start">
                        {allowedMfaOptions.map((type) => (
                          <Checkbox key={type} value={type}>
                            {type}
                          </Checkbox>
                        ))}
                      </CheckboxVStack>
                    </CheckboxGroup>
                  </FormControl>
                )}
              </>
            )}

            {/* Profile Picture / Avatar Upload */}
            <FormControl id="profilePicture" isDisabled={formDisabled}>
              <FormLabel>Profile Picture</FormLabel>
              <Box display="flex" alignItems="center" gap={4}>
                <Avatar
                  size="md"
                  src={
                    preview ||
                    (typeof profilePicture === "string" ? profilePicture : undefined)
                  }
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

            {/* User Active Toggle */}
            <FormControl
              id="isActive"
              isDisabled={formDisabled || (!userIsSuperAdmin && mode === "add")}
            >
              <FormLabel>User Active</FormLabel>
              <Switch
                isChecked={userIsSuperAdmin ? true : isActive}
                onChange={(e) => setIsActive(e.target.checked)}
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

export default UserFormModal;
