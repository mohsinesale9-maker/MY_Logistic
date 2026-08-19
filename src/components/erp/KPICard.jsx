import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

const colorMap = {
  primary: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",
  success: "bg-green-50 text-green-600 dark:bg-green-950/40 dark:text-green-400",
  warning: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400",
  destructive: "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400",
  info: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400",
  purple: "bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400",
  navy: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function AnimatedValue({ value }) {
  const isNumeric = typeof value === "number" || /^\d/.test(String(value || ""));
  const display = useMotionValue(0);
  const rounded = useTransform(display, (v) => Math.round(v));
  const [text, setText] = useState("0");

  useEffect(() => {
    if (!isNumeric) {
      setText(String(value));
      return;
    }
    const numericPart = parseInt(String(value).replace(/[^\d-]/g, "")) || 0;
    const controls = animate(display, numericPart, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => {
        const hasCurrency = String(value).includes("MAD") || String(value).includes("DH");
        const hasPercent = String(value).includes("%");
        let formatted = new Intl.NumberFormat("fr-FR").format(Math.round(v));
        if (hasCurrency) formatted = `${formatted} MAD`;
        if (hasPercent) formatted = `${formatted}%`;
        setText(formatted);
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span>{text}</span>;
}

export default function KPICard({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = "primary",
  subtitle,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="p-5 hover:shadow-enterprise-lg transition-all border-border/60 hover:-translate-y-0.5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
            <p className="text-2xl font-bold mt-1.5 tracking-tight">
              <AnimatedValue value={value} />
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
            {trend !== undefined && trend !== null && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {trend >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                )}
                <span className={trend >= 0 ? "text-green-600" : "text-red-600"}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
                {trendLabel && (
                  <span className="text-muted-foreground">{trendLabel}</span>
                )}
              </div>
            )}
          </div>
          {Icon && (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorMap[color]}`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}