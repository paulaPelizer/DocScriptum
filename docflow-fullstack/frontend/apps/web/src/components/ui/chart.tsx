"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  type TooltipProps,
  type LegendProps,
  type Payload as RechartsPayload,
} from "recharts";

import { cn } from "@/lib/utils";

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = { light: "", dark: ".dark" } as const;

export type ChartConfig = {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<keyof typeof THEMES, string> }
  );
};

type ChartContextProps = { config: ChartConfig };

const ChartContext = React.createContext<ChartContextProps | null>(null);
function useChart() {
  const ctx = React.useContext(ChartContext);
  if (!ctx) throw new Error("useChart must be used within a <ChartContainer />");
  return ctx;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof ResponsiveContainer>["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className,
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "Chart";

export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(([, c]) => c.theme || c.color);
  if (!colorConfig.length) return null;

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(
            ([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
  .map(([key, c]) => {
    const color = c.theme?.[theme as keyof typeof c.theme] ?? c.color;
    return color ? `  --color-${key}: ${color};` : null;
  })
  .filter(Boolean)
  .join("\n")}
}
`,
          )
          .join("\n"),
      }}
    />
  );
};

// Reexports dos primitivos para manter API anterior
export const ChartTooltip = RechartsTooltip;
export const ChartLegend = RechartsLegend;

/** Tooltip com tipagem segura de payload */
export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  // Omitimos `content`, pois nós renderizamos o conteúdo
  Omit<TooltipProps<number, string>, "content"> &
    React.ComponentProps<"div"> & {
      hideLabel?: boolean;
      hideIndicator?: boolean;
      indicator?: "line" | "dot" | "dashed";
      nameKey?: string;
      labelKey?: string;
      color?: string;
      labelClassName?: string;
    }
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
      ...divProps
    },
    ref,
  ) => {
    const { config } = useChart();

    const list = Array.isArray(payload) ? (payload as RechartsPayload<number, string>[]) : [];

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || list.length === 0) return null;

      const [item] = list;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemCfg = getPayloadConfigFromPayload(config, item as any, key);
      const value =
        !labelKey && typeof label === "string"
          ? (config[label as keyof typeof config]?.label ?? label)
          : itemCfg?.label;

      if (labelFormatter) {
        return <div className={cn("font-medium", labelClassName)}>{labelFormatter(value, list)}</div>;
      }
      return value ? <div className={cn("font-medium", labelClassName)}>{value}</div> : null;
    }, [hideLabel, list, labelKey, label, labelFormatter, labelClassName, config]);

    if (!active || list.length === 0) return null;

    const nestLabel = list.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className,
        )}
        {...divProps}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {list.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemCfg = getPayloadConfigFromPayload(config, item as any, key);
            const indicatorColor = color || (item.payload as any)?.fill || (item as any).color;

            return (
              <div
                key={`${item.dataKey}-${index}`}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  indicator === "dot" && "items-center",
                )}
              >
                {formatter && item?.value !== undefined && item.name ? (
                  // assinatura do formatter do Recharts: (value, name, item, index, payload)
                  formatter(item.value as number, item.name as string, item, index, item.payload)
                ) : (
                  <>
                    {itemCfg?.icon ? (
                      <itemCfg.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                            {
                              "h-2.5 w-2.5": indicator === "dot",
                              "w-1": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent": indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            },
                          )}
                          style={
                            {
                              "--color-bg": indicatorColor,
                              "--color-border": indicatorColor,
                            } as React.CSSProperties
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between leading-none",
                        nestLabel ? "items-end" : "items-center",
                      )}
                    >
                      <div className="grid gap-1.5">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-muted-foreground">{itemCfg?.label ?? item.name}</span>
                      </div>
                      {item.value != null && (
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          {Number(item.value).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  },
);
ChartTooltipContent.displayName = "ChartTooltip";

/** Legend com tipagem segura de payload */
export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> &
    Pick<LegendProps, "payload" | "verticalAlign"> & {
      hideIcon?: boolean;
      nameKey?: string;
    }
>(({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey, ...divProps }, ref) => {
  const { config } = useChart();

  const list = Array.isArray(payload) ? (payload as RechartsPayload<number, string>[]) : [];
  if (list.length === 0) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className,
      )}
      {...divProps}
    >
      {list.map((item, idx) => {
        const key = `${nameKey || item.dataKey || "value"}`;
        const itemCfg = getPayloadConfigFromPayload(config, item as any, key);

        return (
          <div
            key={`${item.value}-${idx}`}
            className={cn("flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground")}
          >
            {itemCfg?.icon && !hideIcon ? (
              <itemCfg.icon />
            ) : (
              <div className="h-2 w-2 shrink-0 rounded-[2px]" style={{ backgroundColor: (item as any).color }} />
            )}
            {itemCfg?.label ?? item.value}
          </div>
        );
      })}
    </div>
  );
});
ChartLegendContent.displayName = "ChartLegend";

/** Helper para extrair config a partir de um item do Recharts */
function getPayloadConfigFromPayload(config: ChartConfig, payload: unknown, key: string) {
  if (typeof payload !== "object" || payload === null) return undefined;

  const inner =
    "payload" in payload && typeof (payload as any).payload === "object" && (payload as any).payload !== null
      ? (payload as any).payload
      : undefined;

  let cfgKey: string = key;

  if (key in (payload as any) && typeof (payload as any)[key] === "string") {
    cfgKey = (payload as any)[key] as string;
  } else if (inner && key in inner && typeof inner[key] === "string") {
    cfgKey = inner[key] as string;
  }

  return cfgKey in config ? config[cfgKey] : (config[key] as ChartConfig[keyof ChartConfig] | undefined);
}

export { RechartsTooltip as Tooltip, RechartsLegend as Legend };
