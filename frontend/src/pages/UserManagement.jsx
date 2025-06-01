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
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Avatar,
} from "@chakra-ui/react";
import {
  AddIcon,
  EditIcon,
  DeleteIcon,
  LockIcon,
  UnlockIcon,
} from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";
import UserFormModal from "../components/UserFormModal";
import RoleFormModal from "../components/RoleFormModal";
  
// Helpers – you may leave these as is.
const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";
const getAvatarSrc = (avatar) => {
  if (!avatar) return undefined;
  if (avatar.includes("placeholder") || avatar.includes("via.placeholder.com"))
    return undefined;
  if (!avatar.startsWith("http")) return `${API_BASE}${avatar}`;
  return avatar;
};
  
const getRoleName = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role;
  if (role.name) return role.name;
  return "";
};
  
const UserManagement = () => {
  // --- Existing States ---
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [roleSearchTerm, setRoleSearchTerm] = useState("");
  
  // NEW: State for filtering users by status.
  const [filterStatus, setFilterStatus] = useState("All"); // "All", "Active", "Inactive"
  
  // NEW: Sorting states.
  const [sortField, setSortField] = useState(""); // e.g., "name", "email"
  const [sortOrder, setSortOrder] = useState("asc"); // "asc" or "desc"
  
  // Pagination (existing)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Modal and editing states (existing)
  const [editingUser, setEditingUser] = useState(null);
  const [editingRole, setEditingRole] = useState(null);
  
  // Chakra disclosure hooks for modals.
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  
  // --- Data Fetching (existing) ---
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      console.error("[ERROR] No token found, cannot fetch data.");
      return;
    }
    // Extract tenantId from token (if needed)
    const tokenPayload = JSON.parse(atob(token.split(".")[1]));
    const tenantId =
      tokenPayload.tenantId ||
      tokenPayload.companyID ||
      tokenPayload.companyId;
    if (!tenantId) {
      console.error("[ERROR] Tenant ID missing from token");
      return;
    }
  
    const fetchUsers = async () => {
      try {
        console.log("[DEBUG] Fetching users with token:", token);
        console.log("[DEBUG] Tenant ID from token:", tenantId);
        const response = await fetch(`/api/users?tenantId=${tenantId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok)
          throw new Error(
            `Failed to fetch users: ${response.status} ${response.statusText}`
          );
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
  
  // --- Filtering Logic for Users ---
  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    if (userSearchTerm) {
      const term = userSearchTerm.toLowerCase();
      filtered = filtered.filter((user) => {
        return (
          (user.firstName &&
            user.firstName.toLowerCase().includes(term)) ||
          (user.lastName &&
            user.lastName.toLowerCase().includes(term)) ||
          (user.email && user.email.toLowerCase().includes(term)) ||
          (user.tenant &&
            user.tenant.name &&
            user.tenant.name.toLowerCase().includes(term)) ||
          getRoleName(user.role).toLowerCase().includes(term)
        );
      });
    }
    if (filterStatus !== "All") {
      filtered = filtered.filter((user) =>
        filterStatus === "Active" ? user.isActive : !user.isActive
      );
    }
    return filtered;
  }, [users, userSearchTerm, filterStatus]);
  
  // --- Sorting Logic for Users ---
  // For "name", sort by concatenated firstName and lastName.
  const sortedUsers = useMemo(() => {
    const sorted = [...filteredUsers];
    if (sortField) {
      sorted.sort((a, b) => {
        if (sortField === "name") {
          const aName = `${a.firstName || ""} ${a.lastName || ""}`.trim().toLowerCase();
          const bName = `${b.firstName || ""} ${b.lastName || ""}`.trim().toLowerCase();
          return sortOrder === "asc"
            ? aName.localeCompare(bName)
            : bName.localeCompare(aName);
        } else {
          let aValue = a[sortField] || "";
          let bValue = b[sortField] || "";
          if (typeof aValue === "string" && typeof bValue === "string") {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
            return sortOrder === "asc"
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          }
          return sortOrder === "asc" ? aValue - bValue : bValue - aValue;
        }
      });
    }
    return sorted;
  }, [filteredUsers, sortField, sortOrder]);
  
  // --- Pagination Logic for Users ---
  const totalPages = Math.ceil(sortedUsers.length / itemsPerPage);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedUsers.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedUsers, currentPage]);
  
  // --- New: Filtering Logic for Roles ---
  const filteredRoles = useMemo(() => {
    if (!roleSearchTerm) return roles;
    const term = roleSearchTerm.toLowerCase();
    return roles.filter((role) => {
      return (
        role.name.toLowerCase().includes(term) ||
        (role.description &&
          role.description.toLowerCase().includes(term))
      );
    });
  }, [roles, roleSearchTerm]);
  
  // --- Sorting Handler for Users ---
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };
  
  // --- Modal Handlers for Users ---
  const openAddUserModal = () => {
    setEditingUser(null);
    // Using our existing modal open, for example:
    // Replace with your onUserModalOpen if using a hook; here we set local state.
    setIsUserModalOpen(true);
  };
  
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setIsUserModalOpen(true);
  };
  
  const handleAddOrEditUser = (userData) => {
    if (editingUser && editingUser.id) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...editingUser, ...userData } : u
        )
      );
    } else {
      setUsers((prev) => [...prev, { id: Date.now().toString(), ...userData }]);
    }
    setEditingUser(null);
    setIsUserModalOpen(false);
  };
  
  // --- Handlers for User Status and Deletion (existing) ---
  const handleToggleStatus = async (userId, tenantId, targetRoleName, newStatus) => {
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
        const errData = await res.json();
        throw new Error(errData.message || "Failed to update status");
      }
      setUsers((prev) =>
        prev.map((user) =>
          user.id === userId ? { ...user, isActive: newStatus } : user
        )
      );
    } catch (error) {
      console.error("[ERROR] Toggling status failed:", error.message);
    }
  };
  
  const handleDeleteUser = async (userId, targetRoleName) => {
    try {
      if (targetRoleName === "SuperAdmin") {
        throw new Error("SuperAdmin cannot be deleted");
      }
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(`Failed to delete user: ${res.status} ${res.statusText}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (error) {
      console.error("[ERROR] Deleting user failed:", error.message);
    }
  };
  
  // --- Handlers for Role CRUD (existing) ---
  const handleAddOrEditRole = (roleData) => {
    if (editingRole && editingRole.id) {
      setRoles((prev) =>
        prev.map((r) =>
          r.id === editingRole.id ? { ...editingRole, ...roleData } : r
        )
      );
    } else {
      setRoles((prev) => [...prev, { id: Date.now().toString(), ...roleData }]);
    }
    setEditingRole(null);
    setIsRoleModalOpen(false);
  };
  
  const handleDeleteRole = async (roleId) => {
    try {
      const token = localStorage.getItem("authToken");
      const res = await fetch(`/api/roles/${roleId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok)
        throw new Error(`Failed to delete role: ${res.status} ${res.statusText}`);
      setRoles((prev) => prev.filter((r) => r.id !== roleId));
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
            <TabPanel>
              <Flex mb={4} alignItems="center">
                <Input
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => {
                    setUserSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  maxW="300px"
                />
                <Select
                  placeholder="Filter status"
                  width="150px"
                  ml={4}
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                >
                  <option value="All">All</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
                <Spacer />
                <Button
                  leftIcon={<AddIcon />}
                  colorScheme="blue"
                  onClick={openAddUserModal}
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
                          <Th
                            cursor="pointer"
                            onClick={() => handleSort("name")}
                          >
                            Name{" "}
                            {sortField === "name" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </Th>
                          <Th
                            cursor="pointer"
                            onClick={() => handleSort("email")}
                          >
                            Email{" "}
                            {sortField === "email" &&
                              (sortOrder === "asc" ? "▲" : "▼")}
                          </Th>
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
                            const isSuperAdmin =
                              getRoleName(user.role) === "SuperAdmin";
                            return (
                              <Tr key={user.id} _hover={{ bg: "gray.100" }}>
                                <Td>
                                  <Avatar
                                    size="sm"
                                    src={getAvatarSrc(user.avatar)}
                                    name={`${user.firstName} ${user.lastName}`}
                                  />
                                </Td>
                                <Td>
                                  {user.firstName} {user.lastName}
                                </Td>
                                <Td>{user.email}</Td>
                                <Td>{user.tenant ? user.tenant.name : "N/A"}</Td>
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
                                      onClick={() => openEditUserModal(user)}
                                    />
                                  </Tooltip>
                                  {!isSuperAdmin ? (
                                    <>
                                      <Tooltip
                                        label={
                                          user.isActive
                                            ? "Disable User"
                                            : "Enable User"
                                        }
                                      >
                                        <IconButton
                                          aria-label="Toggle status"
                                          icon={user.isActive ? <LockIcon /> : <UnlockIcon />}
                                          size="sm"
                                          mr={2}
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
                                    </>
                                  ) : (
                                    <Tooltip label="SuperAdmin cannot be disabled">
                                      <IconButton
                                        aria-label="Toggle status"
                                        size="sm"
                                        mr={2}
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
                                          handleDeleteUser(
                                            user.id,
                                            getRoleName(user.role)
                                          )
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
                    setIsRoleModalOpen(true);
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
                                    setIsRoleModalOpen(true);
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
        onClose={() => {
          setEditingUser(null);
          setIsUserModalOpen(false);
        }}
        mode={editingUser ? "edit" : "add"}
        initialData={editingUser}
        onSubmit={handleAddOrEditUser}
        tenants={tenants}
        onUserUpdated={(updatedUser) =>
          setUsers((list) =>
            list.map((user) =>
              user.id === updatedUser.id
                ? { ...user, tenant: updatedUser.tenant, ...updatedUser }
                : user
            )
          )
        }
      />
      <RoleFormModal
        isOpen={isRoleModalOpen}
        onClose={() => {
          setEditingRole(null);
          setIsRoleModalOpen(false);
        }}
        mode={editingRole ? "edit" : "add"}
        initialData={editingRole}
        onSubmit={handleAddOrEditRole}
      />
    </AdminLayout>
  );
};

export default UserManagement;
