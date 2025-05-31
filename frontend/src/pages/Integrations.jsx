import React from "react";
import { Box, Heading, Text } from "@chakra-ui/react";
import AdminLayout from "../components/AdminLayout";

const Integrations = () => {
  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="lg" mb={4}>Integrations</Heading>
        <Text color="gray.600">Manage third-party integrations and API settings here.</Text>
        {/* Add integrations settings */}
      </Box>
    </AdminLayout>
  );
};

export default Integrations;