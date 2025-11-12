"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Database, Play, Download, Save } from "lucide-react";
import { DataTable } from "./data-table";

interface SQLQueryBuilderProps {
  onQueryExecute?: (query: string) => Promise<any[]>;
  onQuerySave?: (query: string, name: string) => void;
}

export function SQLQueryBuilder({ onQueryExecute, onQuerySave }: SQLQueryBuilderProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [queryName, setQueryName] = useState("");

  const predefinedQueries = [
    {
      name: "Top Donors",
      query: `SELECT u.firstName, u.lastName, SUM(d.amount) as total
FROM "Donation" d
JOIN "User" u ON d."userId" = u.id
WHERE d.status = 'completed'
GROUP BY u.id, u.firstName, u.lastName
ORDER BY total DESC
LIMIT 10;`,
    },
    {
      name: "Monthly Attendance",
      query: `SELECT 
  DATE_TRUNC('month', date) as month,
  COUNT(*) as attendance_count
FROM "Attendance"
WHERE status = 'PRESENT'
GROUP BY month
ORDER BY month DESC;`,
    },
    {
      name: "Event Registrations",
      query: `SELECT 
  e.title,
  COUNT(er.id) as registrations,
  COUNT(ec.id) as check_ins
FROM "Event" e
LEFT JOIN "EventRegistration" er ON e.id = er."eventId"
LEFT JOIN "EventCheckIn" ec ON e.id = ec."eventId"
GROUP BY e.id, e.title
ORDER BY registrations DESC;`,
    },
  ];

  const handleExecute = async () => {
    if (!query.trim()) {
      setError("Please enter a SQL query");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (onQueryExecute) {
        const data = await onQueryExecute(query);
        setResults(data);
      } else {
        // Fallback: execute via API
        const response = await fetch("/api/reports/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        if (!response.ok) {
          throw new Error("Query execution failed");
        }

        const data = await response.json();
        setResults(data.results || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to execute query");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    if (!query.trim() || !queryName.trim()) {
      setError("Please provide both query name and SQL query");
      return;
    }

    if (onQuerySave) {
      onQuerySave(query, queryName);
      setQueryName("");
    }
  };

  const loadPredefinedQuery = (predefinedQuery: string) => {
    setQuery(predefinedQuery);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold">
            <Database className="w-5 h-5 text-blue-600" />
            SQL Query Builder
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select
              value=""
              onValueChange={(value) => {
                const predefined = predefinedQueries.find((q) => q.name === value);
                if (predefined) {
                  loadPredefinedQuery(predefined.query);
                }
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Load template..." />
              </SelectTrigger>
              <SelectContent>
                {predefinedQueries.map((q) => (
                  <SelectItem key={q.name} value={q.name}>
                    {q.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>SQL Query</Label>
          <Textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SELECT * FROM ..."
            className="font-mono text-sm min-h-[200px]"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button onClick={handleExecute} disabled={loading} className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            {loading ? "Executing..." : "Execute Query"}
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Input
              placeholder="Query name..."
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              className="max-w-xs"
            />
            <Button
              variant="outline"
              onClick={handleSave}
              disabled={!query.trim() || !queryName.trim()}
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-4">
            <div className="mb-2 text-sm text-gray-600">
              Results: {results.length} row{results.length !== 1 ? "s" : ""}
            </div>
            <DataTable
              data={results}
              columns={
                Object.keys(results[0] || {}).map((key) => ({
                  key,
                  label: key,
                  sortable: true,
                }))
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

