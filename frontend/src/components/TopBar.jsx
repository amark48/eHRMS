// src/components/TopBar.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Flex,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Button,
  useToast,
  Badge,
  useColorMode,
  useColorModeValue,
  Spacer,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Select,
  Tooltip,
} from "@chakra-ui/react";
import { FiBell, FiLogOut, FiSun, FiMoon, FiUser } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const TopBar = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  const navigate = useNavigate();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { user, logout, setUser } = useAuth();

  // Local state for form fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [authType, setAuthType] = useState("Email OTP");
  const [profilePicPreview, setProfilePicPreview] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // On mount, if no user found in the AuthContext, fetch the full profile
  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        console.log("[DEBUG] Fetching full profile for TopBar...");
        const response = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const profileData = await response.json();
          console.log("[DEBUG] Fetched user profile:", profileData);
          setUser(profileData);
        } else {
          console.error("Failed to fetch profile:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      }
    }
    if (!user) {
      fetchProfile();
    }
  }, [user, setUser]);

  // Update local state when the global user changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setAuthType(user.authType || "Email OTP");
      setProfilePicPreview(user.avatar || "");
      setAvatarFile(null);
      // Reset password fields when profile is loaded
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [user]);

  // Compute the full name for display
  const fullName = useMemo(() => {
    if (!user) return "User";
    if (user.firstName || user.lastName) {
      return `${user.firstName || ""} ${user.lastName || ""}`.trim();
    }
    if (user.email) {
      const emailName = user.email.split("@")[0];
      return emailName.charAt(0).toUpperCase() + emailName.slice(1);
    }
    return "User";
  }, [user]);

  // Handle profile picture change event
  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Handle saving profile changes including password update (if provided)
  const handleSaveProfile = async () => {
    // If updating the password, ensure the values match.
    if (newPassword && newPassword !== confirmPassword) {
      toast({
        title: "Passwords do not match",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    // Build FormData to send (supports file upload)
    const formData = new FormData();
    formData.append("firstName", firstName);
    formData.append("lastName", lastName);
    formData.append("authType", authType);
    // Append password update fields if provided
    if (newPassword) {
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);
    }
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          // Let the browser set the correct Content-Type for FormData
        },
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Failed to update profile");
      }
      const updatedProfile = await response.json();
      console.log("Profile updated response:", updatedProfile);
      setUser(updatedProfile);
      toast({
        title: "Profile updated successfully.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error updating profile",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Logout handler
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out successfully.",
      status: "success",
      duration: 3000,
      isClosable: true,
    });
    navigate("/login");
  };

  // Dummy notifications for demonstration
  const [notifications] = useState([
    "New tenant signed up!",
    "Subscription payment received.",
    "System update scheduled for tomorrow.",
  ]);

  return (
    <>
      {/* Header */}
      <Flex
        as="header"
        ml="250px"
        width="calc(100% - 250px)"
        bg={useColorModeValue("white", "gray.700")}
        p={4}
        shadow="sm"
        align="center"
        position="sticky"
        top="0"
        zIndex="1"
      >
        <Box fontSize="lg" fontWeight="bold" color={useColorModeValue("gray.700", "white")}>
          Dashboard
        </Box>
        <Spacer />
        <HStack spacing={4}>
          {/* Notifications */}
          <Box position="relative">
            <Tooltip label="Notifications" fontSize="sm">
              <IconButton
                icon={<FiBell />}
                variant="ghost"
                aria-label="Notifications"
                color={useColorModeValue("gray.700", "white")}
                onClick={() =>
                  toast({
                    title: "Notifications",
                    description: notifications.join("\n"),
                    status: "info",
                    duration: 4000,
                    isClosable: true,
                  })
                }
              />
            </Tooltip>
            {notifications.length > 0 && (
              <Badge
                position="absolute"
                top="0"
                right="0"
                bg="red.500"
                borderRadius="full"
                px={2}
                color="white"
                fontSize="xs"
              >
                {notifications.length}
              </Badge>
            )}
          </Box>
          {/* Theme Toggle */}
          <IconButton
            icon={colorMode === "light" ? <FiMoon /> : <FiSun />}
            variant="ghost"
            aria-label="Toggle Theme"
            onClick={toggleColorMode}
            color={useColorModeValue("gray.700", "white")}
          />
          {/* Profile Dropdown */}
          <Menu>
            <MenuButton>
              <Flex align="center">
                <Avatar size="sm" name={fullName} src={profilePicPreview} cursor="pointer" mr={2} />
                <Box display={{ base: "none", md: "block" }} color={useColorModeValue("gray.700", "white")}>
                  {user ? fullName : "Loading..."}
                </Box>
              </Flex>
            </MenuButton>
            <MenuList>
              <MenuItem icon={<FiUser />} onClick={onOpen}>
                Profile
              </MenuItem>
              <MenuItem icon={<FiLogOut />} onClick={handleLogout}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        </HStack>
      </Flex>

      {/* Optional Debug UI for development */}
      {process.env.NODE_ENV == "production" && (
        <Box ml="260px" p={4} bg="gray.100" color="gray.800">
          <pre>{JSON.stringify(user, null, 2)}</pre>
        </Box>
      )}

      {/* Profile Update Modal */}
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Update Profile</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl id="firstName">
                <FormLabel>First Name</FormLabel>
                <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </FormControl>
              <FormControl id="lastName">
                <FormLabel>Last Name</FormLabel>
                <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </FormControl>
              <FormControl id="email">
                <FormLabel>Email</FormLabel>
                <Input value={user?.email || ""} isReadOnly />
              </FormControl>
              <FormControl id="authType">
                <FormLabel>Authentication Mode</FormLabel>
                <Select value={authType} onChange={(e) => setAuthType(e.target.value)}>
                  <option value="Email OTP">Email OTP</option>
                  <option value="Google Authenticator">Google Authenticator</option>
                </Select>
              </FormControl>
              <FormControl id="profilePic">
                <FormLabel>Profile Picture</FormLabel>
                <Flex align="center">
                  <Avatar size="md" src={profilePicPreview} mr={4} />
                  <Input type="file" accept="image/*" onChange={handleProfilePicChange} />
                </Flex>
              </FormControl>
              {/* New password fields added back */}
              <FormControl id="newPassword">
                <FormLabel>New Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </FormControl>
              <FormControl id="confirmPassword">
                <FormLabel>Confirm New Password</FormLabel>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" onClick={handleSaveProfile}>
              Save Changes
            </Button>
            <Button variant="ghost" onClick={onClose} ml={3}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default TopBar;