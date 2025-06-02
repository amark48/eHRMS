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

  // Dummy cohort data for analytics.
  const cohortData = subscription.cohortAnalytics || [
    { cohort: "Cohort A", conversionRate: 30 },
    { cohort: "Cohort B", conversionRate: 45 },
    { cohort: "Cohort C", conversionRate: 25 }
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
              <Tab>Tenant Associations</Tab>
              <Tab>Analytics</Tab>
            </TabList>
            <TabPanels>
              {/* Overview Tab */}
              <TabPanel>
                <Stack spacing={4}>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Name</Text>
                      <Text fontWeight="semibold">{subscription.name}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Price</Text>
                      <Text fontWeight="semibold">${subscription.price}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Duration</Text>
                      <Text fontWeight="semibold">{subscription.duration}</Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="gray.600">Status</Text>
                      <Text fontWeight="semibold">{subscription.status}</Text>
                    </Box>
                    {subscription.autoRenew !== undefined && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Auto Renew</Text>
                        <Text fontWeight="semibold">{subscription.autoRenew ? "Yes" : "No"}</Text>
                      </Box>
                    )}
                    {subscription.trialPeriodDays !== undefined && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Trial Period Days</Text>
                        <Text fontWeight="semibold">{subscription.trialPeriodDays}</Text>
                      </Box>
                    )}
                    {subscription.startDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Start Date</Text>
                        <Text fontWeight="semibold">{formatDate(subscription.startDate)}</Text>
                      </Box>
                    )}
                    {subscription.endDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">End Date</Text>
                        <Text fontWeight="semibold">{formatDate(subscription.endDate)}</Text>
                      </Box>
                    )}
                    {subscription.renewalDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Renewal Date</Text>
                        <Text fontWeight="semibold">{formatDate(subscription.renewalDate)}</Text>
                      </Box>
                    )}
                    {subscription.nextBillingDate && (
                      <Box>
                        <Text fontSize="sm" color="gray.600">Next Billing Date</Text>
                        <Text fontWeight="semibold">{formatDate(subscription.nextBillingDate)}</Text>
                      </Box>
                    )}
                    {subscription.contractTerms && (
                      <Box gridColumn="1 / -1">
                        <Text fontSize="sm" color="gray.600">Contract Terms</Text>
                        <Text fontWeight="semibold">{subscription.contractTerms}</Text>
                      </Box>
                    )}
                  </Grid>
                  {subscription.description && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" color="gray.600">Description</Text>
                        <Text>{subscription.description}</Text>
                      </Box>
                    </>
                  )}
                  {subscription.features && subscription.features.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontSize="sm" color="gray.600">Included Features</Text>
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
                <Stack spacing={4}>
                  <Text fontSize="md" fontWeight="semibold">Billing & Renewal</Text>
                  <Box ml={4} p={2} bg="gray.50" borderRadius="md">
                    <Text><strong>Price:</strong> ${subscription.price}</Text>
                    <Text><strong>Duration:</strong> {subscription.duration}</Text>
                    <Text>
                      <strong>Auto Renew:</strong> {subscription.autoRenew ? "Yes" : "No"}
                    </Text>
                    <Text>
                      <strong>Renewal Date:</strong>{" "}
                      {subscription.renewalDate ? formatDate(subscription.renewalDate) : "N/A"}
                    </Text>
                    {subscription.trialPeriodDays && (
                      <Text>
                        <strong>Trial Period:</strong> {subscription.trialPeriodDays} days
                      </Text>
                    )}
                  </Box>
                  {subscription.revenue !== undefined && (
                    <Box>
                      <Text><strong>Revenue To Date:</strong> ${subscription.revenue}</Text>
                    </Box>
                  )}
                  {subscription.outstandingInvoices !== undefined && (
                    <Box>
                      <Text><strong>Outstanding Invoices:</strong> ${subscription.outstandingInvoices}</Text>
                    </Box>
                  )}
                  {subscription.discounts && (
                    <Box>
                      <Text>
                        <strong>Discounts / Credits:</strong> {subscription.discounts}
                      </Text>
                    </Box>
                  )}
                  {subscription.billingHistory && subscription.billingHistory.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <Text fontWeight="semibold" mb={2}>Invoice History</Text>
                        {subscription.billingHistory.map((invoice, index) => (
                          <Text key={index}>
                            {formatDate(invoice.date)}: ${invoice.amount} ({invoice.status})
                          </Text>
                        ))}
                      </Box>
                    </>
                  )}
                </Stack>
              </TabPanel>

              {/* Audit & History Tab */}
              <TabPanel>
                <Stack spacing={4}>
                  <Text fontSize="md" fontWeight="semibold">Audit & History</Text>
                  {subscription.auditLogs && subscription.auditLogs.length > 0 ? (
                    subscription.auditLogs.map((log, index) => (
                      <Box key={index} p={2} borderWidth="1px" borderColor="gray.200" borderRadius="md">
                        <Text fontSize="sm" color="gray.600">
                          {formatDate(log.timestamp)}
                        </Text>
                        <Text>{log.event}</Text>
                      </Box>
                    ))
                  ) : (
                    <Text color="gray.500"><em>No audit history available.</em></Text>
                  )}
                </Stack>
              </TabPanel>

              {/* Tenant Associations Tab */}
              <TabPanel>
                <Stack spacing={4}>
                  <Text fontSize="md" fontWeight="semibold">Tenant Associations</Text>
                  {subscription.tenants && subscription.tenants.length > 0 ? (
                    <UnorderedList ml={4}>
                      {subscription.tenants.map((tenant, index) => (
                        <ListItem key={index}>
                          {tenant.name} {tenant.userCount ? `(${tenant.userCount} users)` : ""}
                        </ListItem>
                      ))}
                    </UnorderedList>
                  ) : (
                    <Text color="gray.500"><em>No tenant associations available.</em></Text>
                  )}
                </Stack>
              </TabPanel>

              {/* Analytics Tab */}
              <TabPanel>
                <Stack spacing={4}>
                  <Text fontSize="md" fontWeight="semibold">Historical Revenue</Text>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analyticsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="revenue" stroke="#3182ce" />
                    </LineChart>
                  </ResponsiveContainer>
                  <Text fontSize="md" fontWeight="semibold">Cohort Analysis</Text>
                  {cohortData && cohortData.length > 0 ? (
                    <UnorderedList ml={4}>
                      {cohortData.map((cohort, index) => (
                        <ListItem key={index}>
                          {cohort.cohort}: {cohort.conversionRate}%
                        </ListItem>
                      ))}
                    </UnorderedList>
                  ) : (
                    <Text color="gray.500"><em>No cohort data available.</em></Text>
                  )}
                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => alert("Exporting Subscription Analytics...")}
                  >
                    Export Analytics Report
                  </Button>
                </Stack>
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
