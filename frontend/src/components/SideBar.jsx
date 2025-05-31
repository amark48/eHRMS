import React from "react";
import {
  Box,
  VStack,
  Text,
  Link,
  HStack,
  Icon,
  Divider,
  useColorModeValue,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  IconButton,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import {
  FiHome,         // Dashboard
  FiUsers,        // Tenants
  FiUser,         // User Management
  FiDollarSign,   // Subscription
  FiCreditCard,   // Billing
  FiBarChart2,    // Reports
  FiTrendingUp,   // Analytics
  FiGrid,         // Integrations
  FiClipboard,    // Audit Logs
  FiHelpCircle,   // Support
  FiSettings,     // Settings
  FiMenu,
} from "react-icons/fi";

// Navigation items for the admin panel with recommended enterprise features
const navItems = [
  { label: "Dashboard", path: "/admin/dashboard", icon: FiHome },
  { label: "Tenants", path: "/admin/tenants", icon: FiUsers },
  { label: "User Management", path: "/admin/users", icon: FiUser },
  { label: "Subscription", path: "/admin/subscriptions", icon: FiDollarSign },
  { label: "Billing", path: "/admin/billing", icon: FiCreditCard },
  { label: "Reports", path: "/admin/reports", icon: FiBarChart2 },
  { label: "Analytics", path: "/admin/analytics", icon: FiTrendingUp },
  { label: "Integrations", path: "/admin/integrations", icon: FiGrid },
  { label: "Audit Logs", path: "/admin/audit-logs", icon: FiClipboard },
  { label: "Support", path: "/admin/support", icon: FiHelpCircle },
  { label: "Settings", path: "/admin/settings", icon: FiSettings },
];

// Reusable component for the sidebar content.
const SidebarContent = ({ onClose }) => {
  const bgColor = useColorModeValue("white", "gray.800");
  const textColor = useColorModeValue("gray.700", "gray.200");
  const borderColor = useColorModeValue("gray.200", "gray.700");
  const hoverBg = useColorModeValue("gray.100", "gray.700");

  return (
    <Box
      bg={bgColor}
      color={textColor}
      p={6}
      borderRight="1px"
      borderColor={borderColor}
      height="100%"
    >
      <Text fontSize="2xl" fontWeight="bold" mb={8}>
        Admin Panel
      </Text>
      <VStack spacing={4} align="stretch">
        {navItems.map((item, index) => (
          <Link
            key={index}
            as={RouterLink}
            to={item.path}
            p={3}
            borderRadius="md"
            _hover={{ bg: hoverBg, textDecoration: "none" }}
            onClick={onClose} // Closes the Drawer when an item is clicked.
          >
            <HStack spacing={3}>
              <Icon as={item.icon} w={5} h={5} />
              <Text fontSize="md" fontWeight="medium" noOfLines={1}>
                {item.label}
              </Text>
            </HStack>
          </Link>
        ))}
      </VStack>
      <Divider my={6} borderColor={borderColor} />
      <Text fontSize="sm" color="gray.500" textAlign="center">
        © {new Date().getFullYear()} Your Company
      </Text>
    </Box>
  );
};

const Sidebar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      {/* Fixed Sidebar for medium and larger screens */}
      <Box
        display={{ base: "none", md: "block" }}
        position="fixed"
        top="0"
        left="0"
        w="250px"
        h="100vh"
        overflowY="auto"
        sx={{
          "&::-webkit-scrollbar": {
            width: "0px",
            background: "transparent",
          },
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <SidebarContent onClose={onClose} />
      </Box>

      {/* Hamburger (sandwich) Icon for smaller screens */}
      <Box
        display={{ base: "block", md: "none" }}
        position="fixed"
        top="4"
        left="4"
        zIndex="overlay"
      >
        <IconButton
          icon={<FiMenu />}
          aria-label="Open Menu"
          onClick={onOpen}
          variant="outline"
        />
      </Box>

      {/* Drawer for smaller screens */}
      <Drawer placement="left" onClose={onClose} isOpen={isOpen}>
        <DrawerOverlay>
          <DrawerContent
            maxW="250px"
            overflowY="auto"
            sx={{
              "&::-webkit-scrollbar": {
                width: "0px",
                background: "transparent",
              },
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
            <DrawerBody p={0}>
              <SidebarContent onClose={onClose} />
            </DrawerBody>
          </DrawerContent>
        </DrawerOverlay>
      </Drawer>
    </>
  );
};

export default Sidebar;