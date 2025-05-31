// src/pages/Reports.jsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Heading,
  Text,
  Flex,
  Spacer,
  Button,
  Input,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Spinner,
  Tooltip,
} from "@chakra-ui/react";
import { AddIcon, EditIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import AdminLayout from "../components/AdminLayout";

const Reports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch reports from your API when the component mounts.
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await fetch("/api/reports");
        if (!response.ok) throw new Error("Failed to fetch reports");
        const data = await response.json();
        setReports(data);
      } catch (error) {
        console.error("Error fetching reports:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Filter reports based on the search term.
  const filteredReports = useMemo(() => {
    if (!searchTerm) return reports;
    return reports.filter((report) =>
      report.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [reports, searchTerm]);

  return (
    <AdminLayout>
      <Box p={6}>
        <Heading size="lg" mb={4}>
          Reports
        </Heading>
        <Text color="gray.600" mb={4}>
          Get an overview or drill down into detailed insights of your platform data.
        </Text>

        <Flex mb={4} alignItems="center">
          <Input
            placeholder="Search reports..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Spacer />
          <Button leftIcon={<AddIcon />} colorScheme="blue">
            Generate Report
          </Button>
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
                  <Th>Report Name</Th>
                  <Th>Date Generated</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredReports.length === 0 ? (
                  <Tr>
                    <Td colSpan={4} textAlign="center">
                      No reports found.
                    </Td>
                  </Tr>
                ) : (
                  filteredReports.map((report) => (
                    <Tr key={report.id} _hover={{ bg: "gray.100" }}>
                      <Td>{report.name}</Td>
                      <Td>
                        {new Date(report.generatedAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </Td>
                      <Td>{report.status}</Td>
                      <Td>
                        <Tooltip label="View Details">
                          <IconButton
                            aria-label="View Details"
                            icon={<InfoOutlineIcon />}
                            size="sm"
                            mr={2}
                            onClick={() => {
                              // Open report details or modal
                            }}
                          />
                        </Tooltip>
                        <Tooltip label="Edit Report">
                          <IconButton
                            aria-label="Edit Report"
                            icon={<EditIcon />}
                            size="sm"
                            onClick={() => {
                              // Open edit modal for report
                            }}
                          />
                        </Tooltip>
                      </Td>
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

export default Reports;