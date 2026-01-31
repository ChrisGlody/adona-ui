"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export type JsonSchema = {
  type?: string;
  properties?: Record<string, { type?: string }>;
  required?: string[];
};

export function SchemaEditor({
  title,
  schema,
  onChange,
}: {
  title: string;
  schema: JsonSchema | null | undefined;
  onChange: (s: JsonSchema) => void;
}) {
  const s = schema || { type: "object", properties: {}, required: [] };
  const properties = s.properties || {};
  const required: string[] = Array.isArray(s.required) ? s.required : [];

  function updateProp(name: string, patch: Record<string, unknown>) {
    const next = {
      ...s,
      properties: {
        ...properties,
        [name]: { ...(properties[name] || {}), ...patch },
      },
    };
    onChange(next);
  }
  function renameProp(oldName: string, newName: string) {
    if (!newName || oldName === newName) return;
    const entries = Object.entries(properties).map(([k, v]) => [
      k === oldName ? newName : k,
      v,
    ]);
    const nextProps = Object.fromEntries(entries);
    const nextReq = required.map((r) => (r === oldName ? newName : r));
    onChange({ ...s, properties: nextProps, required: nextReq });
  }
  function toggleRequired(name: string) {
    const isReq = required.includes(name);
    const nextReq = isReq
      ? required.filter((r) => r !== name)
      : [...required, name];
    onChange({ ...s, required: nextReq });
  }
  function addProp() {
    const base = "field";
    let i = 1;
    let name = `${base}${i}`;
    while (properties[name]) {
      i += 1;
      name = `${base}${i}`;
    }
    onChange({
      ...s,
      properties: { ...properties, [name]: { type: "string" } },
    });
  }
  function removeProp(name: string) {
    const { [name]: _, ...rest } = properties;
    onChange({
      ...s,
      properties: rest,
      required: required.filter((r) => r !== name),
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium text-foreground">{title}</Label>
        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={addProp} type="button">
          Add property
        </Button>
      </div>
      <div className="space-y-2">
        {Object.keys(properties).length === 0 && (
          <div className="text-xs text-muted-foreground">No properties</div>
        )}
        {Object.entries(properties).map(([name, prop]) => (
          <div key={name} className="border border-border rounded p-2 space-y-2">
            <div className="flex gap-2 items-center flex-wrap">
              <Input
                className="flex-1 min-w-[80px] h-8 text-sm bg-background border-border"
                value={name}
                onChange={(e) => renameProp(name, e.target.value)}
              />
              <select
                className="h-8 px-2 border border-border rounded text-sm bg-background text-foreground"
                value={prop.type || "string"}
                onChange={(e) => updateProp(name, { type: e.target.value })}
              >
                <option value="string">string</option>
                <option value="number">number</option>
                <option value="boolean">boolean</option>
                <option value="object">object</option>
                <option value="array">array</option>
              </select>
              <label className="flex items-center gap-1 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={required.includes(name)}
                  onChange={() => toggleRequired(name)}
                  className="rounded border-border"
                />
                required
              </label>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive h-7"
                onClick={() => removeProp(name)}
                type="button"
              >
                remove
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
