// src/pages/Login.jsx
import React, { useState } from "react";
import {
  Flex,
  Box,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Button,
  Text,
  Select,
  useToast,
} from "@chakra-ui/react";
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyID, setCompanyID] = useState("");
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  // When the email field loses focus, extract the domain and fetch companies.
  const handleEmailBlur = async () => {
    const trimmedEmail = email.trim();
    const parts = trimmedEmail.split("@");
    if (parts.length !== 2) return; // Basic validation
    const domain = parts[1].toLowerCase();
    try {
      const response = await fetch(
        `http://localhost:5000/api/tenants/by-domain?domain=${domain}`
      );
      if (!response.ok) {
        // If no companies are found, clear the dropdown.
        setCompanies([]);
        return;
      }
      const data = await response.json();
      setCompanies(data); // Expected data: an array of companies [{ id, name }, ...]
      // Auto-select if only one company is returned.
      if (data.length === 1) {
        setCompanyID(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching companies:", error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ensure a company is selected.
    if (!companyID) {
      toast({
        title: "Company Not Selected",
        description: "Please select your company from the dropdown.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, companyID }),
      });
      const data = await response.json();

      if (!response.ok) {
        toast({
          title: "Login Failed",
          description: data.message || "Invalid credentials.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        setLoading(false);
        return;
      }

      // If MFA is required, navigate to the MFA screen.
      if (data.mfaRequired) {
        toast({
          title: "MFA Required",
          description: data.message,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        // Pass along both tempToken and either mfaType or allowedMfaTypes if present.
        navigate("/mfa", {
          state: {
            tempToken: data.tempToken,
            mfaType: data.mfaType || null,
            allowedMfaTypes: data.allowedMfaTypes || null,
          },
        });
      } else {
        localStorage.setItem("authToken", data.token);
        toast({
          title: "Login Successful",
          description: "Welcome back!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("Login error: ", error);
      toast({
        title: "Login Failed",
        description: "An error occurred during login.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }

    setLoading(false);
  };

  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.100">
      <Box bg="white" p={8} borderRadius="lg" shadow="md" width="400px">
        <Heading mb={6} textAlign="center">
          Login
        </Heading>
        <form onSubmit={handleLogin}>
          <FormControl mb={4} isRequired>
            <FormLabel>Email</FormLabel>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={handleEmailBlur}
              placeholder="Enter your email"
              autoComplete="email"
            />
          </FormControl>
          {/* Only show the dropdown if companies have been fetched */}
          {companies.length > 0 && (
            <FormControl mb={4} isRequired>
              <FormLabel>Select Company</FormLabel>
              <Select
                placeholder="Select your company"
                value={companyID}
                onChange={(e) => setCompanyID(e.target.value)}
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </Select>
            </FormControl>
          )}
          <FormControl mb={4} isRequired>
            <FormLabel>Password</FormLabel>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
            />
          </FormControl>
          <Text textAlign="right" mb={4} color="blue.500" fontWeight="bold">
            <Link to="/forgot-password">Forgot Password?</Link>
          </Text>
          <Button type="submit" colorScheme="blue" width="full" isLoading={loading}>
            Login
          </Button>
        </form>
      </Box>
    </Flex>
  );
};

export default Login;