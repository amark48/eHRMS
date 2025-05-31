// src/pages/Settings.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Heading,
  Text,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Switch,
  Button,
  useToast,
} from "@chakra-ui/react";
import AdminLayout from "../components/AdminLayout";

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    siteTitle: "",
    defaultLanguage: "",
    timeZone: "",
    maintenanceMode: false,
  });
  const toast = useToast();

  // Fetch settings from API when the component mounts.
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch("/api/settings");
        if (!response.ok) {
          throw new Error("Failed to fetch settings");
        }
        const data = await response.json();
        // Assume the API returns an object with keys: siteTitle, defaultLanguage, timeZone, maintenanceMode.
        setSettings({ ...data });
      } catch (error) {
        console.error("Error fetching settings:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  // Handle changes for text inputs.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle toggle for maintenance mode.
  const handleToggle = (e) => {
    setSettings((prev) => ({
      ...prev,
      maintenanceMode: e.target.checked,
    }));
  };

  // Handle form submission.
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });
      if (!response.ok) {
        throw new Error("Failed to update settings");
      }
      toast({
        title: "Settings updated.",
        description: "Your system settings have been saved.",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error("Error updating settings:", error);
      toast({
        title: "Error updating settings.",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="xl" mb={4}>
          System Settings
        </Heading>
        <Text color="gray.600" mb={6}>
          Manage global system configurations from one central location.
        </Text>
        {loading ? (
          <Text>Loading settings...</Text>
        ) : (
          <Box as="form" onSubmit={handleSubmit}>
            <VStack spacing={4} align="stretch">
              <FormControl id="siteTitle" isRequired>
                <FormLabel>Site Title</FormLabel>
                <Input
                  type="text"
                  name="siteTitle"
                  value={settings.siteTitle}
                  onChange={handleChange}
                  placeholder="Enter site title"
                />
              </FormControl>
              <FormControl id="defaultLanguage" isRequired>
                <FormLabel>Default Language</FormLabel>
                <Input
                  type="text"
                  name="defaultLanguage"
                  value={settings.defaultLanguage}
                  onChange={handleChange}
                  placeholder="e.g. English"
                />
              </FormControl>
              <FormControl id="timeZone" isRequired>
                <FormLabel>Time Zone</FormLabel>
                <Input
                  type="text"
                  name="timeZone"
                  value={settings.timeZone}
                  onChange={handleChange}
                  placeholder="e.g. America/New_York"
                />
              </FormControl>
              <FormControl display="flex" alignItems="center" id="maintenanceMode">
                <FormLabel mb="0" mr={4}>
                  Maintenance Mode
                </FormLabel>
                <Switch
                  isChecked={settings.maintenanceMode}
                  onChange={handleToggle}
                />
              </FormControl>
              <Button type="submit" colorScheme="blue">
                Save Settings
              </Button>
            </VStack>
          </Box>
        )}
      </Box>
    </AdminLayout>
  );
};

export default Settings;