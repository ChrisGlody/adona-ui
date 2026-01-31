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
import { testDeterminism, getInferenceConfig } from "./actions";
import type { DeterminismTestResult } from "./actions";

export default function DeterministicInferencePage() {
  const [loading, setLoading] = useState(true);
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [systemHost, setSystemHost] = useState("localhost");
  const [systemPort, setSystemPort] = useState("8000");
  const [prompt, setPrompt] = useState("");
  const [numTests, setNumTests] = useState("2");
  const [temperature, setTemperature] = useState("0.0");
  const [topP, setTopP] = useState("1.0");
  const [topK, setTopK] = useState("0");
  const [seed, setSeed] = useState("42");
  const [outputs, setOutputs] = useState<string[]>([]);
  const [summary, setSummary] = useState("");
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/secure");
        if (!res.ok) {
          if (isMounted) router.replace("/login");
          return;
        }
        // Load system config
        const config = await getInferenceConfig();
        if (isMounted) {
          setSystemHost(config.host);
          setSystemPort(config.port);
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

  // Effective host/port (use override or system default)
  const effectiveHost = host.trim() || systemHost;
  const effectivePort = port.trim() || systemPort;

  const handleTestDeterminism = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt");
      return;
    }
    const numTestsValue = parseInt(numTests, 10);
    if (isNaN(numTestsValue) || numTestsValue < 1 || numTestsValue > 100) {
      setError("Number of tests must be between 1 and 100");
      return;
    }
    setTesting(true);
    setOutputs([]);
    setSummary("");
    setError(null);
    try {
      const result: DeterminismTestResult = await testDeterminism({
        host: host.trim() || undefined, // Use system default if empty
        port: port.trim() || undefined, // Use system default if empty
        prompt,
        numTests: numTestsValue,
        temperature: parseFloat(temperature) || 0.0,
        topP: parseFloat(topP) || 1.0,
        topK: parseInt(topK, 10) || 0,
        seed: parseInt(seed, 10) || 42,
      });
      if (result.error) {
        setError(result.error);
        setSummary("❌ Error while generating outputs.");
      } else {
        setOutputs(result.outputs);
        setSummary(
          result.deterministic
            ? "✅ Deterministic: All outputs are identical."
            : "⚠️ Non-deterministic: Outputs differ."
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
      setSummary("❌ Error while generating outputs.");
    } finally {
      setTesting(false);
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

  const endpointUrl = `${effectiveHost.startsWith("http://") || effectiveHost.startsWith("https://") ? `${effectiveHost}:${effectivePort}` : `http://${effectiveHost}:${effectivePort}`}/generate`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <MainNav />
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Determinism Tester</h1>
          <p className="text-muted-foreground">
            Test deterministic inference by running multiple tests with the same parameters
          </p>
        </div>
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Configuration</CardTitle>
            <CardDescription>Configure the API endpoint and test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-3 mb-2">
              <p className="text-xs text-muted-foreground mb-1">System Default (from env vars):</p>
              <p className="text-sm font-mono text-foreground">
                INFERENCE_HOST: <span className="text-primary">{systemHost}</span> | INFERENCE_PORT: <span className="text-primary">{systemPort}</span>
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="host" className="text-sm font-medium text-foreground">
                  Host Override <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input id="host" value={host} onChange={(e) => setHost(e.target.value)} placeholder={systemHost} className="bg-background border-border" />
              </div>
              <div className="space-y-2">
                <label htmlFor="port" className="text-sm font-medium text-foreground">
                  Port Override <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Input id="port" value={port} onChange={(e) => setPort(e.target.value)} placeholder={systemPort} className="bg-background border-border" />
              </div>
            </div>
            <div className="rounded-md border border-border bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Endpoint URL (using {host.trim() || port.trim() ? "override" : "system default"}):</p>
              <p className="text-sm font-mono text-foreground">{endpointUrl}</p>
            </div>
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-medium text-foreground">
                Prompt
              </label>
              <Textarea id="prompt" rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Enter prompt here..." className="bg-background border-border" />
            </div>
            <div className="border-t border-border pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Test Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="numTests" className="text-sm font-medium text-foreground">
                    Number of Tests
                  </label>
                  <Input id="numTests" type="number" min={1} max={1000} value={numTests} onChange={(e) => setNumTests(e.target.value)} placeholder="100" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="seed" className="text-sm font-medium text-foreground">
                    Seed
                  </label>
                  <Input id="seed" type="number" value={seed} onChange={(e) => setSeed(e.target.value)} placeholder="42" className="bg-background border-border" />
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-4 space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Sampling Parameters</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="temperature" className="text-sm font-medium text-foreground">
                    Temperature
                  </label>
                  <Input id="temperature" type="number" step="0.1" min={0} value={temperature} onChange={(e) => setTemperature(e.target.value)} placeholder="0.0" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="topP" className="text-sm font-medium text-foreground">
                    Top P
                  </label>
                  <Input id="topP" type="number" step="0.1" min={0} max={1} value={topP} onChange={(e) => setTopP(e.target.value)} placeholder="1.0" className="bg-background border-border" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="topK" className="text-sm font-medium text-foreground">
                    Top K
                  </label>
                  <Input id="topK" type="number" min={0} value={topK} onChange={(e) => setTopK(e.target.value)} placeholder="0" className="bg-background border-border" />
                </div>
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md p-3">
                {error}
              </div>
            )}
            <Button onClick={handleTestDeterminism} disabled={testing} className="w-full">
              {testing ? `Testing... (${outputs.length}/${numTests})` : `Run ${numTests} Tests`}
            </Button>
          </CardContent>
        </Card>
        {testing && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            </CardContent>
          </Card>
        )}
        {summary && (
          <Card className="bg-card border-border">
            <CardContent className="pt-6">
              <p
                className={`text-lg font-medium ${
                  summary.includes("✅") ? "text-primary" : summary.includes("⚠️") ? "text-muted-foreground" : "text-destructive"
                }`}
              >
                {summary}
              </p>
            </CardContent>
          </Card>
        )}
        {outputs.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Outputs ({outputs.length} results)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {outputs.map((o, idx) => (
                  <div key={idx} className="border border-border rounded-md p-3 bg-muted/50">
                    <div className="text-sm font-medium mb-1 text-foreground">Output #{idx + 1}:</div>
                    <pre className="text-sm font-mono bg-background p-2 rounded border border-border whitespace-pre-wrap break-words text-foreground">
                      {o}
                    </pre>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
