// src/pages/AuditLogs.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Input,
  Table,
  TableContainer,
  Tbody,
  Thead,
  Tr,
  Th,
  Td,
  Spinner,
} from "@chakra-ui/react";
import AdminLayout from "../components/AdminLayout";

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch audit log data from your API when the component mounts.
  useEffect(() => {
    const fetchAuditLogs = async () => {
      try {
        const response = await fetch("/api/audit-logs");
        if (!response.ok) throw new Error("Failed to fetch audit logs");
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAuditLogs();
  }, []);

  // Filter logs based on the user-provided search term.
  // This example assumes each log has a `user`, `action`, and `timestamp` field.
  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    return logs.filter(
      (log) =>
        (log.user && log.user.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.action && log.action.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [logs, searchTerm]);

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="lg" mb={4}>
          Audit Logs
        </Heading>
        <Text color="gray.600" mb={4}>
          Monitor system activity and review important events.
        </Text>

        <Flex mb={4} align="center">
          <Input
            placeholder="Search audit logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" minH="200px">
            <Spinner size="xl" />
          </Flex>
        ) : (
          <TableContainer>
            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>User</Th>
                  <Th>Action</Th>
                  <Th>Timestamp</Th>
                  <Th>Details</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredLogs.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center">
                      No audit logs found.
                    </Td>
                  </Tr>
                ) : (
                  filteredLogs.map((log) => (
                    <Tr key={log.id} _hover={{ bg: "gray.100" }}>
                      <Td>{log.user}</Td>
                      <Td>{log.action}</Td>
                      <Td>
                        {new Date(log.timestamp).toLocaleString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Td>
                      <Td>{log.details || "—"}</Td>
                    </Tr>
                  ))
                )}
              </Tbody>
            </Table>
          </TableContainer>
        )}
      </Box>
    </AdminLayout>
  );
};

export default AuditLogs;