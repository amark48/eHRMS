import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  List,
  ListItem,
  ListIcon,
} from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { FiActivity } from "react-icons/fi";
import AdminLayout from "../components/AdminLayout";

// Sample data for charts
const monthlyData = [
  { month: "Jan", revenue: 12000 },
  { month: "Feb", revenue: 15000 },
  { month: "Mar", revenue: 13000 },
  { month: "Apr", revenue: 17000 },
  { month: "May", revenue: 19000 },
  { month: "Jun", revenue: 22000 },
];

const userDistributionData = [
  { product: "Product A", users: 400 },
  { product: "Product B", users: 300 },
  { product: "Product C", users: 500 },
  { product: "Product D", users: 200 },
];

const subscriptionData = [
  { name: "Basic", value: 400, color: "#3182CE" },
  { name: "Pro", value: 300, color: "#38A169" },
  { name: "Enterprise", value: 300, color: "#D69E2E" },
];

const subscriptionGrowthData = [
  { month: "Jan", subscriptions: 40 },
  { month: "Feb", subscriptions: 55 },
  { month: "Mar", subscriptions: 35 },
  { month: "Apr", subscriptions: 60 },
  { month: "May", subscriptions: 75 },
  { month: "Jun", subscriptions: 90 },
];

const bouncesData = [
  { country: "United States", bounces: 6000 },
  { country: "India", bounces: 1500 },
  { country: "United Kingdom", bounces: 1000 },
  { country: "Canada", bounces: 800 },
  { country: "Australia", bounces: 600 },
];

const trafficData = [
  { type: "Referral", value: 36.7, color: "#3182CE" },
  { type: "Organic", value: 31.4, color: "#38A169" },
  { type: "Direct", value: 25.1, color: "#D69E2E" },
  { type: "Twitter", value: 3, color: "#FF8042" },
  { type: "Menu", value: 2, color: "#8884d8" },
  { type: "Other", value: 1.8, color: "#82ca9d" },
];

const recentActivity = [
  { id: 1, text: "User John Doe signed up." },
  { id: 2, text: "Tenant ABC renewed their subscription." },
  { id: 3, text: "Payment received for Tenant XYZ." },
];

const AdminDashboard = () => {
  return (
    <AdminLayout>
      <Flex direction="column" p={6}>
        {/* Dashboard Header */}
        <Heading size="lg" mb={4}>
          Admin Dashboard
        </Heading>
        <Text color="gray.600">Welcome to the admin panel.</Text>

        {/* Overview Metrics (Stat Cards) */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mt={6}>
          <Stat p={4} bg="white" borderRadius="md" boxShadow="md">
            <StatLabel>Total Users</StatLabel>
            <StatNumber>2,345</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              5.2%
            </StatHelpText>
          </Stat>
          <Stat p={4} bg="white" borderRadius="md" boxShadow="md">
            <StatLabel>Active Sessions</StatLabel>
            <StatNumber>1,234</StatNumber>
            <StatHelpText>
              <StatArrow type="decrease" />
              1.2%
            </StatHelpText>
          </Stat>
          <Stat p={4} bg="white" borderRadius="md" boxShadow="md">
            <StatLabel>Revenue</StatLabel>
            <StatNumber>$12,345</StatNumber>
            <StatHelpText>
              <StatArrow type="increase" />
              3.4%
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Charts Section */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
          {/* Line Chart: Monthly Revenue Trends */}
          <Box p={4} bg="white" boxShadow="md" borderRadius="lg" height="250px">
            <Text mb={2} fontWeight="semibold">
              Monthly Revenue Trends
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3182CE"
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Box>

          {/* Bar Chart: User Distribution by Product */}
          <Box p={4} bg="white" boxShadow="md" borderRadius="lg" height="250px">
            <Text mb={2} fontWeight="semibold">
              User Distribution by Product
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userDistributionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="product" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="users" fill="#38A169" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SimpleGrid>

        {/* Subscription Section */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mt={6}>
          {/* Pie Chart: Subscription Breakdown */}
          <Box p={4} bg="white" boxShadow="md" borderRadius="lg" height="250px">
            <Text mb={2} fontWeight="semibold">
              Subscription Breakdown
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {subscriptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>

          {/* Bar Chart: Subscription Growth */}
          <Box p={4} bg="white" boxShadow="md" borderRadius="lg" height="250px">
            <Text mb={2} fontWeight="semibold">
              Subscription Growth
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subscriptionGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="subscriptions" fill="#FF8042" />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </SimpleGrid>

        {/* Website Analytics Section */}
        <Heading size="md" mt={12} mb={4}>
          Website Analytics
        </Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
          {/* Bar Chart: Bounces by Country / Territory */}
          <Box p={4} bg="white" boxShadow="md" borderRadius="lg" height="250px">
            <Text mb={2} fontWeight="semibold">
              Bounces by Country / Territory
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bouncesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="bounces" fill="#E53E3E" />
              </BarChart>
            </ResponsiveContainer>
          </Box>

          {/* Pie Chart: Visits by Traffic Type */}
          <Box p={4} bg="white" boxShadow="md" borderRadius="lg" height="250px">
            <Text mb={2} fontWeight="semibold">
              Visits by Traffic Type
            </Text>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={trafficData}
                  dataKey="value"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  label
                >
                  {trafficData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </SimpleGrid>

        {/* Recent Activity Widget (moved to the bottom) */}
        <Box mt={6} p={4} bg="white" boxShadow="md" borderRadius="lg">
          <Text mb={2} fontWeight="semibold">
            Recent Activity
          </Text>
          <List spacing={3}>
            {recentActivity.map((activity) => (
              <ListItem key={activity.id}>
                <ListIcon as={FiActivity} color="green.500" />
                {activity.text}
              </ListItem>
            ))}
          </List>
        </Box>
      </Flex>
    </AdminLayout>
  );
};

export default AdminDashboard;