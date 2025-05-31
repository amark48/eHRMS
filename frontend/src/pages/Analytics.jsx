// src/pages/Analytics.jsx
import React, { useEffect, useState } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
} from "@chakra-ui/react";
import AdminLayout from "../components/AdminLayout";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState(null);

  // Fetch analytics data on component mount.
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch("/api/analytics");
        if (!response.ok) throw new Error("Failed to fetch analytics data");
        const data = await response.json();
        setAnalyticsData(data);
      } catch (error) {
        console.error("Error fetching analytics data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  // Example assumes the API returns a structure similar to this:
  // {
  //   summary: {
  //     totalRevenue: number,
  //     activeUsers: number,
  //     newSubscriptions: number,
  //     churnRate: number
  //   },
  //   trends: [
  //     { date: "2024-01-01", revenue: 1000, users: 50, subscriptions: 10 },
  //     { date: "2024-01-02", revenue: 1500, users: 55, subscriptions: 12 },
  //     ...
  //   ]
  // }

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="xl" mb={4}>Analytics Dashboard</Heading>
        <Text color="gray.600" mb={6}>Enterprise level insights at a glance.</Text>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" />
          </Flex>
        ) : analyticsData ? (
          <>
            {/* Summary Metrics */}
            <SimpleGrid columns={[1, 2, 4]} spacing={6} mb={8}>
              <Stat borderWidth="1px" borderRadius="lg" p={4}>
                <StatLabel>Total Revenue</StatLabel>
                <StatNumber>${analyticsData.summary.totalRevenue.toLocaleString()}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" /> Sales this period
                </StatHelpText>
              </Stat>
              <Stat borderWidth="1px" borderRadius="lg" p={4}>
                <StatLabel>Active Users</StatLabel>
                <StatNumber>{analyticsData.summary.activeUsers}</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" /> Since last month
                </StatHelpText>
              </Stat>
              <Stat borderWidth="1px" borderRadius="lg" p={4}>
                <StatLabel>New Subscriptions</StatLabel>
                <StatNumber>{analyticsData.summary.newSubscriptions}</StatNumber>
                <StatHelpText>
                  <StatArrow type="increase" /> This week
                </StatHelpText>
              </Stat>
              <Stat borderWidth="1px" borderRadius="lg" p={4}>
                <StatLabel>Churn Rate</StatLabel>
                <StatNumber>{analyticsData.summary.churnRate}%</StatNumber>
                <StatHelpText>
                  <StatArrow type="decrease" /> Current period
                </StatHelpText>
              </Stat>
            </SimpleGrid>

            {/* Trend Chart */}
            <Box borderWidth="1px" borderRadius="lg" p={4}>
              <Heading size="md" mb={4}>Revenue Trend</Heading>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.trends}>
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#3182ce"
                    strokeWidth={2}
                  />
                  <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(value) => `$${value}`} labelFormatter={(label) => `Date: ${label}`} />
                </LineChart>
              </ResponsiveContainer>
            </Box>
          </>
        ) : (
          <Text>No analytics data available.</Text>
        )}
      </Box>
    </AdminLayout>
  );
};

export default Analytics;