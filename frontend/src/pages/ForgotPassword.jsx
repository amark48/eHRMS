import React, { useState } from "react";
import { Box, Button, Flex, FormControl, FormLabel, Heading, Input, Text } from "@chakra-ui/react";
import axios from "axios";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleResetRequest = async () => {
    try {
      const response = await axios.post("/api/auth/reset-password", { email });
      setMessage(response.data.message || "If your email is registered, you'll receive a reset link.");
    } catch (error) {
      setMessage("Failed to send reset request. Try again.");
    }
  };

  return (
    <Flex align="center" justify="center" height="100vh" bgGradient="linear(to-r, blue.50, gray.100)">
      <Box p={8} bg="white" boxShadow="xl" borderRadius="lg" width="400px">
        <Heading mb={4} textAlign="center" color="blue.600" fontSize="2xl">Forgot Password</Heading>
        <Text color="gray.600" mb={4} textAlign="center">
          Enter your email, and we'll send you a password reset link.
        </Text>
        <FormControl>
          <FormLabel>Email</FormLabel>
          <Input type="email" placeholder="Enter your email" focusBorderColor="blue.500" onChange={(e) => setEmail(e.target.value)} />
        </FormControl>
        <Button colorScheme="blue" width="100%" mt={6} _hover={{ bg: "blue.700" }} onClick={handleResetRequest}>
          Send Reset Link
        </Button>
        {message && <Text color="blue.600" mt={4} textAlign="center">{message}</Text>}
      </Box>
    </Flex>
  );
};

export default ForgotPassword;