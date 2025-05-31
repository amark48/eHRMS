// src/pages/MfaScreen.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Heading,
  Text,
  useToast,
} from "@chakra-ui/react";
import { useLocation, useNavigate } from "react-router-dom";

const MfaScreen = () => {
  // Extract the navigation state which should include tempToken, mfaType, and allowedMfaTypes.
  const { state } = useLocation();
  const { tempToken, mfaType, allowedMfaTypes, initialMessage } = state || {};

  // Compute an effective MFA method to display:
  const effectiveMfaType =
    mfaType ? mfaType : allowedMfaTypes ? allowedMfaTypes.join(", ") : "Not configured";

  const [mfaCode, setMfaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpRequested, setOtpRequested] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    console.log("[DEBUG] MfaScreen mounted with:", {
      tempToken,
      mfaType,
      allowedMfaTypes,
      effectiveMfaType,
    });
  }, [tempToken, mfaType, allowedMfaTypes, effectiveMfaType]);

  // For EMAIL/SMS flows: Request an OTP code from the server.
  const sendMfaCode = async () => {
    console.log("[DEBUG] sendMfaCode: Initiating MFA Code Request");
    console.log("[DEBUG] sendMfaCode: Using tempToken:", tempToken);
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/request-mfa-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
      });
      console.log("[DEBUG] sendMfaCode: Received response:", response);
      let data;
      try {
        data = await response.json();
        console.log("[DEBUG] sendMfaCode: Parsed response JSON:", data);
      } catch (jsonError) {
        console.error("[DEBUG] sendMfaCode: Error parsing JSON:", jsonError);
        const errorText = await response.text();
        console.error("[DEBUG] sendMfaCode: Raw error text:", errorText);
        throw new Error("Failed to parse JSON from server");
      }
      if (!response.ok) {
        console.error("[DEBUG] sendMfaCode: Unsuccessful response status:", response.status);
        toast({
          title: "Error sending MFA code",
          description: data.message || "Unable to send OTP code.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.log("[DEBUG] sendMfaCode: OTP code sent successfully:", data);
        toast({
          title: "OTP Sent",
          description: data.message,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setOtpRequested(true);
      }
    } catch (error) {
      console.error("[DEBUG] sendMfaCode: Caught error while sending MFA code:", error);
      toast({
        title: "Error",
        description: "Unable to send OTP code. Please try again later.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  // Verify the MFA code using the /api/auth/verify-mfa endpoint.
  const verifyMfaCode = async () => {
    console.log(`[DEBUG] verifyMfaCode: Initiating MFA Code Verification with code: "${mfaCode}"`);
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/auth/verify-mfa", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tempToken}`,
        },
        body: JSON.stringify({ code: mfaCode }),
      });
      console.log("[DEBUG] verifyMfaCode: Received response:", response);
      let data;
      try {
        data = await response.json();
        console.log("[DEBUG] verifyMfaCode: Parsed response JSON:", data);
      } catch (jsonError) {
        console.error("[DEBUG] verifyMfaCode: Error parsing JSON:", jsonError);
        throw new Error("Failed to parse JSON from server");
      }
      if (!response.ok) {
        console.error("[DEBUG] verifyMfaCode: Unsuccessful response status:", response.status);
        toast({
          title: "MFA Verification Failed",
          description: data.message || "Invalid MFA code.",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      } else {
        console.log("[DEBUG] verifyMfaCode: MFA Verified successfully:", data);
        toast({
          title: "MFA Verified",
          description: "You have been successfully logged in.",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        // Save the final token and navigate to the dashboard.
        localStorage.setItem("authToken", data.token);
        console.log("[DEBUG] verifyMfaCode: Navigating to /admin/dashboard");
        navigate("/admin/dashboard");
      }
    } catch (error) {
      console.error("[DEBUG] verifyMfaCode: Caught error during MFA verification:", error);
      toast({
        title: "Error",
        description: "Unable to verify MFA code. Please try again.",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
    setLoading(false);
  };

  // Decide on the instruction message.
  const instructionMessage =
    initialMessage ||
    (effectiveMfaType === "TOTP"
      ? "Please open your authenticator app (Google/Microsoft Authenticator) and enter the code."
      : "Please request the OTP code and then enter it below.");

  return (
    <Flex align="center" justify="center" minH="100vh" bg="gray.100">
      <Box bg="white" p={8} borderRadius="lg" shadow="md" width="400px">
        <Heading mb={2} textAlign="center">
          MFA Verification
        </Heading>
        {/* Display the effective MFA type */}
        <Text fontWeight="bold" textAlign="center" mb={4}>
          MFA Method: {effectiveMfaType}
        </Text>
        <Text mb={4} textAlign="center">
          {instructionMessage}
        </Text>
        {/* For EMAIL or SMS MFA, if not TOTP, show a button to request the OTP */}
        {effectiveMfaType !== "TOTP" && !otpRequested && (
          <Button
            colorScheme="teal"
            variant="outline"
            width="full"
            mb={4}
            onClick={sendMfaCode}
            isLoading={loading}
          >
            Request MFA Code
          </Button>
        )}
        <FormControl mb={4} isRequired>
          <FormLabel>Enter MFA Code</FormLabel>
          <Input
            type="text"
            value={mfaCode}
            onChange={(e) => {
              console.log("[DEBUG] onChange: MFA Code changed to:", e.target.value);
              setMfaCode(e.target.value);
            }}
            placeholder="Enter code"
          />
        </FormControl>
        <Button
          colorScheme="blue"
          width="full"
          onClick={verifyMfaCode}
          isLoading={loading}
        >
          Verify Code
        </Button>
      </Box>
    </Flex>
  );
};

export default MfaScreen;