import React, { useMemo } from "react";
import { Box, Flex, Text } from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer
} from "recharts";

const SubscriptionAnalytics = ({ subscriptions }) => {
  // Aggregate the number of subscriptions per plan.
  const planCount = useMemo(() => {
    const counts = {};
    subscriptions.forEach((sub) => {
      // Use sub.plan if available, otherwise use sub.name as the plan identifier.
      const plan = sub.plan || sub.name;
      counts[plan] = counts[plan] ? counts[plan] + 1 : 1;
    });
    return Object.entries(counts).map(([plan, count]) => ({ plan, count }));
  }, [subscriptions]);

  // Aggregate total revenue per plan.
  const revenueByPlan = useMemo(() => {
    const revenue = {};
    subscriptions.forEach((sub) => {
      const plan = sub.plan || sub.name;
      const price = Number(sub.price) || 0;
      revenue[plan] = revenue[plan] ? revenue[plan] + price : price;
    });
    return Object.entries(revenue).map(([plan, revenue]) => ({ plan, revenue }));
  }, [subscriptions]);

  // Count upcoming renewals (renewalDate within the next 30 days).
  const upcomingRenewals = useMemo(() => {
    const now = new Date();
    return subscriptions.filter((sub) => {
      if (!sub.renewalDate) return false;
      const renewalDate = new Date(sub.renewalDate);
      const diffDays = (renewalDate - now) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }).length;
  }, [subscriptions]);

  return (
    <Box>
      <Flex mb={4} justify="space-around" align="center">
        <Box textAlign="center">
          <Text fontSize="lg" fontWeight="bold">
            Upcoming Renewals
          </Text>
          <Text fontSize="2xl" color="blue.600">
            {upcomingRenewals}
          </Text>
        </Box>
      </Flex>
      <Flex direction={{ base: "column", md: "row" }} gap={6}>
        <Box flex={1} height={250}>
          <Text fontSize="md" mb={2} textAlign="center" fontWeight="semibold">
            Subscriptions per Plan
          </Text>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={planCount}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3182ce" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
        <Box flex={1} height={250}>
          <Text fontSize="md" mb={2} textAlign="center" fontWeight="semibold">
            Revenue per Plan ($)
          </Text>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueByPlan}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#2f855a" />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Flex>
    </Box>
  );
};

export default SubscriptionAnalytics;
