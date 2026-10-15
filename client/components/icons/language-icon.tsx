import { Code2 } from "lucide-react";
import type { IconType } from "react-icons";
import {
  SiC,
  SiClojure,
  SiCplusplus,
  SiCrystal,
  SiCss,
  SiDart,
  SiDocker,
  SiElixir,
  SiErlang,
  SiFsharp,
  SiGnubash,
  SiGo,
  SiGraphql,
  SiHaskell,
  SiHtml5,
  SiJavascript,
  SiJson,
  SiJupyter,
  SiKotlin,
  SiLua,
  SiMarkdown,
  SiMysql,
  SiNextdotjs,
  SiNodedotjs,
  SiPhp,
  SiPython,
  SiR,
  SiReact,
  SiRuby,
  SiRust,
  SiScala,
  SiSharp,
  SiSolidity,
  SiSqlite,
  SiSwift,
  SiTerraform,
  SiTypescript,
  SiVuedotjs,
  SiWebassembly,
  SiYaml,
  SiZig,
} from "react-icons/si";

import { cn } from "@/lib/utils";

type LanguageConfig = {
  Icon: IconType;
  bg: string;
  iconClass: string;
};

const LANGUAGE_MAP: Record<string, LanguageConfig> = {
  JavaScript: {
    Icon: SiJavascript,
    bg: "bg-[#F7DF1E]",
    iconClass: "text-[#323330]",
  },
  "Jupyter Notebook": {
    Icon: SiJupyter,
    bg: "bg-[#F37626]",
    iconClass: "text-white",
  },
  TypeScript: {
    Icon: SiTypescript,
    bg: "bg-[#3178C6]",
    iconClass: "text-white",
  },
  Java: {
    Icon: Code2 as unknown as IconType,
    bg: "bg-[#ED8B00]",
    iconClass: "text-white",
  },
  Python: {
    Icon: SiPython,
    bg: "bg-[#3776AB]",
    iconClass: "text-white",
  },
  C: {
    Icon: SiC,
    bg: "bg-[#A8B9CC]",
    iconClass: "text-[#283593]",
  },
  "C++": {
    Icon: SiCplusplus,
    bg: "bg-[#00599C]",
    iconClass: "text-white",
  },
  "C#": {
    Icon: SiSharp,
    bg: "bg-[#68217A]",
    iconClass: "text-white",
  },
  Go: {
    Icon: SiGo,
    bg: "bg-[#00ADD8]",
    iconClass: "text-white",
  },
  Rust: {
    Icon: SiRust,
    bg: "bg-[#CE422B]",
    iconClass: "text-white",
  },
  Ruby: {
    Icon: SiRuby,
    bg: "bg-[#CC342D]",
    iconClass: "text-white",
  },
  PHP: {
    Icon: SiPhp,
    bg: "bg-[#777BB4]",
    iconClass: "text-white",
  },
  Kotlin: {
    Icon: SiKotlin,
    bg: "bg-[#7F52FF]",
    iconClass: "text-white",
  },
  Swift: {
    Icon: SiSwift,
    bg: "bg-[#F05138]",
    iconClass: "text-white",
  },
  Dart: {
    Icon: SiDart,
    bg: "bg-[#0175C2]",
    iconClass: "text-white",
  },
  Scala: {
    Icon: SiScala,
    bg: "bg-[#DC322F]",
    iconClass: "text-white",
  },
  Elixir: {
    Icon: SiElixir,
    bg: "bg-[#4B275F]",
    iconClass: "text-white",
  },
  Erlang: {
    Icon: SiErlang,
    bg: "bg-[#A90533]",
    iconClass: "text-white",
  },
  Haskell: {
    Icon: SiHaskell,
    bg: "bg-[#5D4F85]",
    iconClass: "text-white",
  },
  "F#": {
    Icon: SiFsharp,
    bg: "bg-[#378BBA]",
    iconClass: "text-white",
  },
  Clojure: {
    Icon: SiClojure,
    bg: "bg-[#5881D8]",
    iconClass: "text-white",
  },
  Solidity: {
    Icon: SiSolidity,
    bg: "bg-[#363636]",
    iconClass: "text-white",
  },
  Lua: {
    Icon: SiLua,
    bg: "bg-[#000080]",
    iconClass: "text-white",
  },
  R: {
    Icon: SiR,
    bg: "bg-[#276DC3]",
    iconClass: "text-white",
  },
  Crystal: {
    Icon: SiCrystal,
    bg: "bg-[#000000]",
    iconClass: "text-white",
  },
  Zig: {
    Icon: SiZig,
    bg: "bg-[#F7A41D]",
    iconClass: "text-black",
  },
  Bash: {
    Icon: SiGnubash,
    bg: "bg-[#4EAA25]",
    iconClass: "text-white",
  },
  Shell: {
    Icon: SiGnubash,
    bg: "bg-[#4EAA25]",
    iconClass: "text-white",
  },
  SQL: {
    Icon: SiMysql,
    bg: "bg-[#4479A1]",
    iconClass: "text-white",
  },
  MySQL: {
    Icon: SiMysql,
    bg: "bg-[#4479A1]",
    iconClass: "text-white",
  },
  SQLite: {
    Icon: SiSqlite,
    bg: "bg-[#003B57]",
    iconClass: "text-white",
  },
  GraphQL: {
    Icon: SiGraphql,
    bg: "bg-[#E10098]",
    iconClass: "text-white",
  },
  HTML: {
    Icon: SiHtml5,
    bg: "bg-[#E34F26]",
    iconClass: "text-white",
  },
  HTML5: {
    Icon: SiHtml5,
    bg: "bg-[#E34F26]",
    iconClass: "text-white",
  },
  CSS: {
    Icon: SiCss,
    bg: "bg-[#1572B6]",
    iconClass: "text-white",
  },
  JSON: {
    Icon: SiJson,
    bg: "bg-[#292929]",
    iconClass: "text-white",
  },
  Markdown: {
    Icon: SiMarkdown,
    bg: "bg-[#083FA1]",
    iconClass: "text-white",
  },
  YAML: {
    Icon: SiYaml,
    bg: "bg-[#CB171E]",
    iconClass: "text-white",
  },
  Docker: {
    Icon: SiDocker,
    bg: "bg-[#2496ED]",
    iconClass: "text-white",
  },
  Terraform: {
    Icon: SiTerraform,
    bg: "bg-[#844FBA]",
    iconClass: "text-white",
  },
  React: {
    Icon: SiReact,
    bg: "bg-[#20232A]",
    iconClass: "text-[#61DAFB]",
  },
  "Next.js": {
    Icon: SiNextdotjs,
    bg: "bg-[#000000]",
    iconClass: "text-white",
  },
  Node: {
    Icon: SiNodedotjs,
    bg: "bg-[#339933]",
    iconClass: "text-white",
  },
  "Node.js": {
    Icon: SiNodedotjs,
    bg: "bg-[#339933]",
    iconClass: "text-white",
  },
  Vue: {
    Icon: SiVuedotjs,
    bg: "bg-[#4FC08D]",
    iconClass: "text-white",
  },
  WebAssembly: {
    Icon: SiWebassembly,
    bg: "bg-[#654FF0]",
    iconClass: "text-white",
  },
};

type LanguageIconProps = {
  language?: string | null;
  className?: string;
  iconClassName?: string;
};

export function getLanguageConfig(
  language?: string | null
): LanguageConfig | undefined {
  const key = language?.trim();
  if (!key) return undefined;

  if (LANGUAGE_MAP[key]) return LANGUAGE_MAP[key];

  const match = Object.keys(LANGUAGE_MAP).find(
    (name) => name.toLowerCase() === key.toLowerCase()
  );

  return match ? LANGUAGE_MAP[match] : undefined;
}

export function LanguageIcon({
  language,
  className,
  iconClassName,
}: LanguageIconProps) {
  const config = getLanguageConfig(language);

  const Icon = config?.Icon ?? (Code2 as unknown as IconType);

  return (
    <div
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
        config?.bg ?? "bg-muted",
        className
      )}
      title={language || "Unknown"}
      aria-label={language || "Unknown"}
    >
      <Icon
        className={cn(
          "h-5 w-5",
          config?.iconClass ?? "text-foreground",
          iconClassName
        )}
        aria-hidden="true"
      />
    </div>
  );
}