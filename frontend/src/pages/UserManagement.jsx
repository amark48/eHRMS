// src/pages/UserManagement.jsx

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
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useDisclosure,
  Avatar,
} from "@chakra-ui/react";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  UnlockIcon,
  ViewIcon,
} from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import UserFormModal from "../components/UserFormModal";
import RoleFormModal from "../components/RoleFormModal";

// Helper to construct avatar URL if needed.
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const getAvatarSrc = (avatar) => {
  if (!avatar) return undefined;
  if (avatar.includes("placeholder") || avatar.includes("via.placeholder.com"))
    return undefined;
  if (!avatar.startsWith("http")) return `${API_BASE}${avatar}`;
  return avatar;
};

// Helper to safely extract a role name from a user.role property.
const getRoleName = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role;
  if (role.name) return role.name;
  return "";
};

const UserManagement = () => {
  // State variables.
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);

  // Pagination state.
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10; // Adjust as needed

  // Modal hooks.
  const {
    isOpen: isUserModalOpen,
    onOpen: onUserModalOpen,
    onClose: onUserModalClose,
  } = useDisclosure();
  const {
    isOpen: isRoleModalOpen,
    onOpen: onRoleModalOpen,
    onClose: onRoleModalClose,
  } = useDisclosure();

  // Fetch data on mount.
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("[ERROR] No token found, cannot fetch data.");
      return;
    }
    const fetchUsers = async () => {
      try {
        console.log("[DEBUG] Fetching users with token:", token);
        const tokenPayload = JSON.parse(atob(token.split(".")[1]));
        const tenantId =
          tokenPayload.tenantId ||
          tokenPayload.companyID ||
          tokenPayload.companyId;
        if (!tenantId)
          throw new Error("Tenant ID missing from token, cannot enforce isolation");
        console.log("[DEBUG] Tenant ID from token:", tenantId);
        const response = await fetch(`/api/users?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch users: ${response.status} ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log("[DEBUG] Users fetched successfully:", data);
        setUsers(data);
      } catch (error) {
        console.error("[ERROR] Fetching users failed:", error.message);
      } finally {
        setLoadingUsers(false);
      }
    };

    const fetchRoles = async () => {
      try {
        console.log("[DEBUG] Fetching roles with token:", token);
        const response = await fetch("/api/roles", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(
            `Failed to fetch roles: ${response.status} ${response.statusText}`
          );
        const data = await response.json();
        console.log("[DEBUG] Roles fetched successfully:", data);
        setRoles(data);
      } catch (error) {
        console.error("[ERROR] Fetching roles failed:", error.message);
      } finally {
        setLoadingRoles(false);
      }
    };

    const fetchTenants = async () => {
      try {
        console.log("[DEBUG] Fetching tenants with token:", token);
        const response = await fetch("/api/tenants", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(
            `Failed to fetch tenants: ${response.status} ${response.statusText}`
          );
        const data = await response.json();
        console.log("[DEBUG] Tenants fetched successfully:", data);
        setTenants(data);
      } catch (error) {
        console.error("[ERROR] Fetching tenants failed:", error.message);
      }
    };

    fetchUsers();
    fetchRoles();
    fetchTenants();
  }, []);

  // Filter users based on the search term.
  const filteredUsers = useMemo(() => {
    if (!userSearchTerm) return users;
    const term = userSearchTerm.toLowerCase();
    return users.filter((user) => {
      return (
        (user.firstName &&
          user.firstName.toLowerCase().includes(term)) ||
        (user.lastName &&
          user.lastName.toLowerCase().includes(term)) ||
        (user.email && user.email.toLowerCase().includes(term)) ||
        (user.tenant &&
          user.tenant.name &&
          user.tenant.name.toLowerCase().includes(term)) ||
        (getRoleName(user.role).toLowerCase().includes(term))
      );
    });
  }, [users, userSearchTerm]);

  // Pagination: Calculate total pages and slice the filtered user array.
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Filter roles based on the search term.
  const filteredRoles = useMemo(() => {
    if (!roleSearchTerm) return roles;
    const term = roleSearchTerm.toLowerCase();
    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(term) ||
        (role.description && role.description.toLowerCase().includes(term))
      );
    });
  }, [roles, roleSearchTerm]);

  // Handlers for user CRUD.
  const handleAddOrEditUser = (userData) => {
    if (editingUser && editingUser.id) {
      setUsers(
        users.map((u) =>
          u.id === editingUser.id ? { ...editingUser, ...userData } : u
        )
      );
    } else {
      // Temporary ID generation; ideally, your backend returns the new user
      setUsers([...users, { id: Date.now().toString(), ...userData }]);
    }
    setEditingUser(null);
    onUserModalClose();
  };

  const handleToggleStatus = async (userId, targetTenantId, targetRoleName, newStatus) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/users/${userId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (!res.ok) {
        const errorResponse = await res.json();
        throw new Error(errorResponse.message || "Failed to update user status");
      }
      // Update local state.
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );
    } catch (err) {
      console.error("[ERROR] Failed to toggle user status:", err);
    }
  };

  const handleDeleteUser = async (userId, targetRoleName) => {
    try {
      // Prevent deletion of SuperAdmin users.
      if (targetRoleName === "SuperAdmin") {
        throw new Error("SuperAdmin user cannot be deleted");
      }
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token found, cannot delete user");
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`Failed to delete user: ${res.status} ${res.statusText}`);
      }
      // Remove user from local state.
      setUsers(users.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("[ERROR] Deleting user failed:", error.message);
    }
  };

  // Handlers for role CRUD.
  const handleAddOrEditRole = (roleData) => {
    if (editingRole && editingRole.id) {
      setRoles(
        roles.map((r) =>
          r.id === editingRole.id ? { ...editingRole, ...roleData } : r
        )
      );
    } else {
      setRoles([...roles, { id: Date.now().toString(), ...roleData }]);
    }
    setEditingRole(null);
    onRoleModalClose();
  };

  const handleDeleteRole = async (roleId) => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No token found, cannot delete role");
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(`Failed to delete role: ${res.status} ${res.statusText}`);
      setRoles(roles.filter((r) => r.id !== roleId));
    } catch (error) {
      console.error("[ERROR] Deleting role failed:", error.message);
    }
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="xl" mb={4}>
          User Management
        </Heading>
        <Text color="gray.600" mb={6}>
          Create new user accounts and manage roles. Each user belongs to a Tenant and has a designated role.
        </Text>
        <Tabs variant="enclosed">
          <TabList>
            <Tab>User Accounts</Tab>
            <Tab>Manage Roles</Tab>
          </TabList>
          <TabPanels>
            {/* User Accounts Tab */}
            <TabPanel>
              <Flex mb={4} alignItems="center">
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setCurrentPage(1); // reset pagination when search changes
                  }}
                  maxW="300px" // reduced width
                />
                <Spacer />
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={() => {
                    setEditingUser(null);
                    onUserModalOpen();
                  }}
                >
                  Create New User
                </Button>
              </Flex>
              {loadingUsers ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" />
                </Flex>
              ) : (
                <>
                  <TableContainer>
                    <Table variant="simple">
                      <Thead>
                        <Tr>
                          <Th>Avatar</Th>
                          <Th>Name</Th>
                          <Th>Email</Th>
                          <Th>Tenant</Th>
                          <Th>Role</Th>
                          <Th>Status</Th>
                          <Th>Actions</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {paginatedUsers.length === 0 ? (
                          <Tr>
                            <Td colSpan={7} textAlign="center">
                              No users found.
                            </Td>
                          </Tr>
                        ) : (
                          paginatedUsers.map((user) => {
                            const isSuperAdmin = getRoleName(user.role) === "SuperAdmin";
                            return (
                              <Tr key={user.id} _hover={{ bg: "gray.100" }}>
                                <Td>
                                  <Avatar
                                    size="sm"
                                    src={getAvatarSrc(user.avatar)}
                                    name={`${user.firstName} ${user.lastName}`}
                                  />
                                </Td>
                                <Td>{user.firstName} {user.lastName}</Td>
                                <Td>{user.email}</Td>
                                <Td>{user.tenant?.name || "N/A"}</Td>
                                <Td>{getRoleName(user.role) || "N/A"}</Td>
                                <Td>
                                  <Text color={user.isActive ? "green.600" : "gray.500"}>
                                    {user.isActive ? "Active" : "Inactive"}
                                  </Text>
                                </Td>
                                <Td>
                                  <Tooltip label="Edit User">
                                    <IconButton
                                      aria-label="Edit user"
                                      icon={<EditIcon />}
                                      size="sm"
                                      mr={2}
                                      onClick={() => {
                                        setEditingUser(user);
                                        onUserModalOpen();
                                      }}
                                    />
                                  </Tooltip>
                                  {!isSuperAdmin ? (
                                    <Tooltip label={user.isActive ? "Disable User" : "Enable User"}>
                                      <IconButton
                                        aria-label="Toggle active status"
                                        size="sm"
                                        mr={2}
                                        icon={user.isActive ? <LockIcon /> : <UnlockIcon />}
                                        onClick={() =>
                                          handleToggleStatus(
                                            user.id,
                                            user.tenant?.id,
                                            getRoleName(user.role),
                                            !user.isActive
                                          )
                                        }
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip label="SuperAdmin cannot be disabled">
                                      <IconButton
                                        aria-label="Locked"
                                        size="sm"
                                        icon={<LockIcon />}
                                        isDisabled
                                      />
                                    </Tooltip>
                                  )}
                                  {isSuperAdmin ? (
                                    <Tooltip label="SuperAdmin cannot be deleted">
                                      <IconButton
                                        aria-label="Delete user"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        isDisabled
                                      />
                                    </Tooltip>
                                  ) : (
                                    <Tooltip label="Delete User">
                                      <IconButton
                                        aria-label="Delete user"
                                        icon={<DeleteIcon />}
                                        size="sm"
                                        onClick={() =>
                                          handleDeleteUser(user.id, getRoleName(user.role))
                                        }
                                      />
                                    </Tooltip>
                                  )}
                                </Td>
                              </Tr>
                            );
                          })
                        )}
                      </Tbody>
                    </Table>
                  </TableContainer>
                  {/* Pagination Controls */}
                  <Flex mt={4} justify="center" align="center">
                    <Button
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      disabled={currentPage === 1}
                      mr={2}
                    >
                      Previous
                    </Button>
                    <Text>
                      Page {currentPage} of {totalPages || 1}
                    </Text>
                    <Button
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      ml={2}
                    >
                      Next
                    </Button>
                  </Flex>
                </>
              )}
            </TabPanel>
            {/* Manage Roles Tab */}
            <TabPanel>
              <Flex mb={4} alignItems="center">
                <Input
                  placeholder="Search roles..."
                  value={roleSearchTerm}
                  onChange={(e) => setRoleSearchTerm(e.target.value)}
                  maxW="300px"
                />
                <Spacer />
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={() => {
                    setEditingRole(null);
                    onRoleModalOpen();
                  }}
                >
                  Create New Role
                </Button>
              </Flex>
              {loadingRoles ? (
                <Flex justify="center" align="center" minH="200px">
                  <Spinner size="xl" />
                </Flex>
              ) : (
                <TableContainer>
                  <Table variant="simple">
                    <Thead>
                      <Tr>
                        <Th>Role Name</Th>
                        <Th>Description</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {filteredRoles.length === 0 ? (
                        <Tr>
                          <Td colSpan={3} textAlign="center">
                            No roles found.
                          </Td>
                        </Tr>
                      ) : (
                        filteredRoles.map((role) => (
                          <Tr key={role.id} _hover={{ bg: "gray.100" }}>
                            <Td>{role.name}</Td>
                            <Td>{role.description || "—"}</Td>
                            <Td>
                              <Tooltip label="Edit Role">
                                <IconButton
                                  aria-label="Edit role"
                                  icon={<EditIcon />}
                                  size="sm"
                                  mr={2}
                                  onClick={() => {
                                    setEditingRole(role);
                                    onRoleModalOpen();
                                  }}
                                />
                              </Tooltip>
                              <Tooltip label="Delete Role">
                                <IconButton
                                  aria-label="Delete role"
                                  icon={<DeleteIcon />}
                                  size="sm"
                                  onClick={() => handleDeleteRole(role.id)}
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
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
      <UserFormModal
        isOpen={isUserModalOpen}
        onClose={onUserModalClose}
        mode={editingUser ? "edit" : "add"}
        initialData={editingUser}
        onSubmit={handleAddOrEditUser}
        tenants={tenants}
        onUserUpdated={(updatedUser) => {
          setUsers((list) =>
            list.map((user) =>
              user.id === updatedUser.id
                ? { ...user, tenant: updatedUser.tenant, ...updatedUser }
                : user
            )
          );
        }}
      />
      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={onRoleModalClose}
        mode={editingRole ? "edit" : "add"}
        initialData={editingRole}
        onSubmit={handleAddOrEditRole}
        //testing
      />
    </AdminLayout>
  );
};

export default UserManagement;

