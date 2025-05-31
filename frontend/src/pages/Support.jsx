import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import AdminLayout from "../components/AdminLayout";

const Support = () => {
  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="lg" mb={4}>Support</Heading>
        <Text color="gray.600">Access help documentation and contact support.</Text>
        {/* Add support functionality */}
      </Box>
    </AdminLayout>
  );
};

export default Support;