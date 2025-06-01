import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Box,
  Grid,
  Text,
  Divider,
  Stack,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  UnorderedList,
  ListItem
} from "@chakra-ui/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// Helper function to format date strings.
const formatDate = (dateString) => {
  const dt = new Date(dateString);
  return dt.toLocaleDateString();
};

const SubscriptionDetailModal = ({ isOpen, onClose, subscription }) => {
  if (!subscription) return null;

  // Dummy analytics data – replace with subscription.analytics if available.
  const analyticsData = subscription.analytics || [
    { date: "2025-05-01", revenue: 100 },
    { date: "2025-06-01", revenue: 150 },
    { date: "2025-07-01", revenue: 130 },
    { date: "2025-08-01", revenue: 200 }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Subscription Details</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Overview</Tab>
              <Tab>Billing & Renewal</Tab>
              <Tab>Audit & History</Tab>
              <Tab>Analytics</Tab>
            </TabList>
            <TabPanels>
              {/* Overview Tab */}
              <TabPanel>
                <Stack spacing={4}>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Name
                      </Text>
                      <Text fontWeight="semibold">{subscription.name}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Price
                      </Text>
                      <Text fontWeight="semibold">${subscription.price}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Duration
                      </Text>
                      <Text fontWeight="semibold">{subscription.duration}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">
                        Status
                      </Text>
                      <Text fontWeight="semibold">{subscription.status}</Text>
                    </Box>
                    {subscription.autoRenew !== undefined && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Auto Renew
                        </Text>
                        <Text fontWeight="semibold">{subscription.autoRenew ? "Yes" : "No"}</Text>
                      </Box>
                    )}
                    {subscription.trialPeriodDays !== undefined && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Trial Period Days
                        </Text>
                        <Text fontWeight="semibold">{subscription.trialPeriodDays}</Text>
                      </Box>
                    )}
                    {subscription.startDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Start Date
                        </Text>
                        <Text fontWeight="semibold">{formatDate(subscription.startDate)}</Text>
                      </Box>
                    )}
                    {subscription.endDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          End Date
                        </Text>
                        <Text fontWeight="semibold">{formatDate(subscription.endDate)}</Text>
                      </Box>
                    )}
                    {subscription.renewalDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Renewal Date
                        </Text>
                        <Text fontWeight="semibold">{formatDate(subscription.renewalDate)}</Text>
                      </Box>
                    )}
                    {subscription.nextBillingDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Next Billing Date
                        </Text>
                        <Text fontWeight="semibold">{formatDate(subscription.nextBillingDate)}</Text>
                      </Box>
                    )}
                  </Grid>
                  {subscription.description && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Description
                        </Text>
                        <Text>{subscription.description}</Text>
                      </Box>
                    </>
                  )}
                  {subscription.features && subscription.features.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" color="gray.600">
                          Included Features
                        </Text>
                        <UnorderedList ml={4}>
                          {subscription.features.map((feature, index) => (
                            <ListItem key={index}>{feature}</ListItem>
                          ))}
                        </UnorderedList>
                      </Box>
                    </>
                  )}
                </Stack>
              </TabPanel>
              {/* Billing & Renewal Tab */}
              <TabPanel>
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={2}>
                    Billing & Renewal
                  </Text>
                  <Text>
                    Detailed billing information (such as billing dates and renewal information) is not available at this time.
                  </Text>
                  {/* Populate with real data when available */}
                </Box>
              </TabPanel>
              {/* Audit & History Tab */}
              <TabPanel>
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={2}>
                    Audit & History
                  </Text>
                  <Text>
                    There is currently no audit history available for this subscription.
                  </Text>
                  {/* Expand as needed to show a timeline of updates and activity logs */}
                </Box>
              </TabPanel>
              {/* Analytics Tab */}
              <TabPanel>
                <Box>
                  <Text fontSize="md" fontWeight="semibold" mb={2}>
                    Historical Revenue
                  </Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#3182ce" />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SubscriptionDetailModal;
