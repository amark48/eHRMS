import React from "react";
import { Box } from "@chakra-ui/react";
import TopBar from "./TopBar";
import SideBar from "./SideBar";

const AdminLayout = ({ children }) => {
  return (
    <>
      {/* TopBar is rendered at the top */}
      <TopBar />
      
      {/* Sidebar is fixed on larger screens */}
      <SideBar />
      
      {/* Main Content Area: adds a left margin to account for the fixed Sidebar */}
      <Box ml={{ base: 0, md: "250px" }} p={6} bg="gray.50">
        {children}
      </Box>
    </>
  );
};

export default AdminLayout;