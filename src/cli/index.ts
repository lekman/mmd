#!/usr/bin/env bun
import { Command } from "commander";
import { checkCommand } from "./commands/check.ts";
import { configCommand } from "./commands/config.ts";
import { extractCommand } from "./commands/extract.ts";
import { initCommand } from "./commands/init.ts";
import { injectCommand } from "./commands/inject.ts";
import { renderCommand } from "./commands/render.ts";
import { syncCommand } from "./commands/sync.ts";

const program = new Command();

program
  .name("mmd")
  .description("Mermaid diagram management — extract, render, and inject themed SVGs")
  .version("0.0.0");

program.addCommand(extractCommand);
program.addCommand(renderCommand);
program.addCommand(injectCommand);
program.addCommand(syncCommand);
program.addCommand(checkCommand);
program.addCommand(configCommand);
program.addCommand(initCommand);

program.parse();
