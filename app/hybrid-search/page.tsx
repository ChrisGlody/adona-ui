"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MainNav } from "@/components/main-nav";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import type { SearchResult } from "./types";

export default function HybridSearchPage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [docText, setDocText] = useState("");
  const [docId, setDocId] = useState("");
  const [addingDoc, setAddingDoc] = useState(false);
  const [addDocResult, setAddDocResult] = useState<{ id: string; success: boolean; error?: string } | null>(null);
  const [batchJson, setBatchJson] = useState("");
  const [batchSize, setBatchSize] = useState("4");
  const [uploadingBatch, setUploadingBatch] = useState(false);
  const [batchResult, setBatchResult] = useState<{ ids: string[]; success: boolean; error?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchLimit, setSearchLimit] = useState("10");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(false);
  const [initResult, setInitResult] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/secure");
        if (!res.ok) {
          if (isMounted) router.replace("/login");
          return;
        }
      } catch {
        if (isMounted) router.replace("/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const handleAddDocument = async () => {
    if (!docText.trim()) {
      setAddDocResult({ id: "", success: false, error: "Text is required" });
      return;
    }
    setAddingDoc(true);
    setAddDocResult(null);
    try {
      const response = await fetch("/api/hybrid-search/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: docText.trim(), id: docId.trim() || undefined }),
      });
      const result = await response.json();
      setAddDocResult(result);
      if (result.success) {
        setDocText("");
        setDocId("");
      }
    } catch (error) {
      setAddDocResult({ id: "", success: false, error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setAddingDoc(false);
    }
  };

  const handleBatchUpload = async () => {
    if (!batchJson.trim()) {
      setBatchResult({ ids: [], success: false, error: "JSON is required" });
      return;
    }
    let documents: { text: string; id?: string }[];
    try {
      documents = JSON.parse(batchJson);
      if (!Array.isArray(documents)) throw new Error("JSON must be an array");
    } catch (error) {
      setBatchResult({ ids: [], success: false, error: error instanceof Error ? error.message : "Invalid JSON" });
      return;
    }
    const batchSizeNum = parseInt(batchSize, 10);
    if (isNaN(batchSizeNum) || batchSizeNum < 1 || batchSizeNum > 100) {
      setBatchResult({ ids: [], success: false, error: "Batch size must be 1–100" });
      return;
    }
    setUploadingBatch(true);
    setBatchResult(null);
    try {
      const response = await fetch("/api/hybrid-search/documents/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documents, batchSize: batchSizeNum }),
      });
      const result = await response.json();
      setBatchResult(result);
      if (result.success) setBatchJson("");
    } catch (error) {
      setBatchResult({ ids: [], success: false, error: error instanceof Error ? error.message : "Unknown error" });
    } finally {
      setUploadingBatch(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchError("Query is required");
      return;
    }
    const limitNum = parseInt(searchLimit, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      setSearchError("Limit must be 1–100");
      return;
    }
    setSearching(true);
    setSearchResults([]);
    setSearchError(null);
    try {
      const response = await fetch("/api/hybrid-search/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery.trim(), limit: limitNum }),
      });
      const result = await response.json();
      if (result.success) setSearchResults(result.results ?? []);
      else setSearchError(result.error ?? "Search failed");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setSearching(false);
    }
  };

  const handleInitialize = async () => {
    setInitializing(true);
    setInitResult(null);
    try {
      const response = await fetch("/api/hybrid-search/collection", { method: "POST", headers: { "Content-Type": "application/json" } });
      const result = await response.json();
      setInitResult(result.success ? "Collection initialized successfully" : result.error ?? "Failed to initialize");
    } catch (error) {
      setInitResult(error instanceof Error ? error.message : "Unknown error");
    } finally {
      setInitializing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <MainNav />
        <div className="p-6">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Hybrid Search</h1>
          <p className="text-muted-foreground">
            Combining semantic and keyword search. Initialize collection, add documents, then search.
          </p>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Collection Setup</CardTitle>
            <CardDescription>Initialize the hybrid search collection</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleInitialize} disabled={initializing} variant="outline">
              {initializing ? "Initializing..." : "Initialize Collection"}
            </Button>
            {initResult && (
              <div
                className={`text-sm rounded-md p-3 ${
                  initResult.includes("successfully")
                    ? "bg-primary/10 text-primary border border-primary/30"
                    : "bg-destructive/10 text-destructive border border-destructive/30"
                }`}
              >
                {initResult}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Add Document</CardTitle>
            <CardDescription>Add a single document to the index</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Document ID (optional)</label>
              <Input value={docId} onChange={(e) => setDocId(e.target.value)} className="bg-background border-border" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Text</label>
              <Textarea value={docText} onChange={(e) => setDocText(e.target.value)} rows={4} className="bg-background border-border" />
            </div>
            <Button onClick={handleAddDocument} disabled={addingDoc}>
              {addingDoc ? "Adding..." : "Add Document"}
            </Button>
            {addDocResult && (
              <div className={`text-sm rounded-md p-3 ${addDocResult.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {addDocResult.success ? `Added: ${addDocResult.id}` : addDocResult.error}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Batch Upload</CardTitle>
            <CardDescription>Upload documents as JSON array: [{"{ \"text\": \"...\" }"}]</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input value={batchSize} onChange={(e) => setBatchSize(e.target.value)} placeholder="Batch size" className="bg-background border-border max-w-24" />
            <Textarea value={batchJson} onChange={(e) => setBatchJson(e.target.value)} rows={6} className="font-mono bg-background border-border" placeholder='[{"text": "doc 1"}, {"text": "doc 2"}]' />
            <Button onClick={handleBatchUpload} disabled={uploadingBatch}>
              {uploadingBatch ? "Uploading..." : "Upload Batch"}
            </Button>
            {batchResult && (
              <div className={`text-sm rounded-md p-3 ${batchResult.success ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"}`}>
                {batchResult.success ? `Uploaded ${batchResult.ids?.length ?? 0} docs` : batchResult.error}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Search</CardTitle>
            <CardDescription>Run a hybrid search query</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Query" className="bg-background border-border flex-1" />
              <Input type="number" value={searchLimit} onChange={(e) => setSearchLimit(e.target.value)} placeholder="Limit" className="bg-background border-border w-24" />
            </div>
            <Button onClick={handleSearch} disabled={searching}>
              {searching ? "Searching..." : "Search"}
            </Button>
            {searchError && <div className="text-sm text-destructive">{searchError}</div>}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Results ({searchResults.length})</h4>
                {searchResults.map((r, i) => (
                  <div key={i} className="border border-border rounded-md p-3 bg-muted/50">
                    <div className="text-sm text-muted-foreground">Score: {r.score}</div>
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words text-foreground">{JSON.stringify(r.payload, null, 2)}</pre>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
