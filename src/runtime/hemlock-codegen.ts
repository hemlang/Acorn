/**
 * Generates executable Hemlock source from compiled BlockAction trees.
 *
 * Unlike the code-preview generator (editor/generators.ts), which renders
 * directly from Blockly blocks for display, this emitter produces one
 * standalone script per event handler for execution through the Hemlock
 * WASM interpreter.
 *
 * Execution protocol (per handler run):
 *   - `inst` — object with x, y, direction, speed, visible, size, destroyed
 *   - sprite variables are bound as top-level context variables
 *   - `print(...)` appends to `__out`; `create(...)` appends to `__new`
 *     (helpers defined by HEMLOCK_PRELUDE, reset before each run)
 */

import { BlockAction, Expression, CompiledHandler } from "./types.js";

/** Degrees → radians factor; block sin/cos and directions use degrees. */
const DEG = "0.017453292519943295";

/**
 * Helper functions evaluated once per Hemlock context. Output and instance
 * creation are collected into arrays the host reads back after each run.
 */
export const HEMLOCK_PRELUDE = `__out = [];
__new = [];

fn print(msg) {
  __out.push(msg);
}

fn create(sprite, x, y) {
  __new.push({ sprite: sprite, x: x, y: y });
}

fn destroy() {
  inst.destroyed = true;
}
`;

/** Generate a standalone Hemlock script for one event handler. */
export function generateHandlerSource(handler: CompiledHandler): string {
  return emitActions(handler.actions, "");
}

/**
 * Collect all variable names referenced by a sprite's handlers, so the
 * runner can bind them into the context before each run and read them
 * back after.
 */
export function collectVariableNames(handlers: CompiledHandler[]): string[] {
  const names = new Set<string>();
  for (const handler of handlers) {
    collectFromActions(handler.actions, names);
  }
  return [...names];
}

/**
 * Map a user-entered variable name to a valid Hemlock identifier.
 * The TS interpreter accepts any name as a dictionary key, but Hemlock
 * source requires identifiers.
 */
export function sanitizeIdentifier(name: string): string {
  const safe = name.replace(/[^A-Za-z0-9_]/g, "_");
  return /^[A-Za-z_]/.test(safe) ? safe : `_${safe}`;
}

function collectFromActions(actions: BlockAction[], names: Set<string>): void {
  for (const action of actions) {
    switch (action.type) {
      case "set_variable":
      case "change_variable":
        names.add(action.name);
        collectFromExpression(action.value, names);
        break;
      case "if":
        collectFromExpression(action.condition, names);
        collectFromActions(action.body, names);
        break;
      case "if_else":
        collectFromExpression(action.condition, names);
        collectFromActions(action.thenBody, names);
        collectFromActions(action.elseBody, names);
        break;
      case "repeat":
        collectFromExpression(action.count, names);
        collectFromActions(action.body, names);
        break;
      case "while":
        collectFromExpression(action.condition, names);
        collectFromActions(action.body, names);
        break;
      case "set_x":
      case "set_y":
      case "change_x":
      case "change_y":
      case "set_direction":
      case "move_forward":
      case "set_visible":
      case "set_size":
        collectFromExpression(action.value, names);
        break;
      case "create_instance":
        collectFromExpression(action.x, names);
        collectFromExpression(action.y, names);
        break;
      case "print":
        collectFromExpression(action.message, names);
        break;
      default:
        break;
    }
  }
}

function collectFromExpression(expr: Expression, names: Set<string>): void {
  switch (expr.type) {
    case "variable":
      names.add(expr.name);
      break;
    case "arithmetic":
    case "comparison":
    case "logic":
      collectFromExpression(expr.left, names);
      collectFromExpression(expr.right, names);
      break;
    case "not":
      collectFromExpression(expr.operand, names);
      break;
    case "random":
      collectFromExpression(expr.min, names);
      collectFromExpression(expr.max, names);
      break;
    case "math_fn":
      collectFromExpression(expr.arg, names);
      break;
    default:
      break;
  }
}

function emitActions(actions: BlockAction[], indent: string): string {
  return actions.map((a) => emitAction(a, indent)).join("");
}

function emitAction(action: BlockAction, indent: string): string {
  const inner = indent + "  ";

  switch (action.type) {
    case "set_x":
      return `${indent}inst.x = ${emitExpr(action.value)};\n`;
    case "set_y":
      return `${indent}inst.y = ${emitExpr(action.value)};\n`;
    case "change_x":
      return `${indent}inst.x += ${emitExpr(action.value)};\n`;
    case "change_y":
      return `${indent}inst.y += ${emitExpr(action.value)};\n`;
    case "set_direction":
      return `${indent}inst.direction = ${emitExpr(action.value)};\n`;

    case "move_forward": {
      // Directions are in degrees, matching the TS interpreter.
      const dist = emitExpr(action.value);
      return (
        `${indent}inst.x += ${dist} * cos(inst.direction * ${DEG});\n` +
        `${indent}inst.y += ${dist} * sin(inst.direction * ${DEG});\n`
      );
    }

    case "if":
      return (
        `${indent}if (${emitExpr(action.condition)}) {\n` +
        emitActions(action.body, inner) +
        `${indent}}\n`
      );

    case "if_else":
      return (
        `${indent}if (${emitExpr(action.condition)}) {\n` +
        emitActions(action.thenBody, inner) +
        `${indent}} else {\n` +
        emitActions(action.elseBody, inner) +
        `${indent}}\n`
      );

    case "repeat":
      return (
        `${indent}for (__i in range(${emitExpr(action.count)})) {\n` +
        emitActions(action.body, inner) +
        `${indent}}\n`
      );

    case "while":
      return (
        `${indent}while (${emitExpr(action.condition)}) {\n` +
        emitActions(action.body, inner) +
        `${indent}}\n`
      );

    case "set_variable":
      return `${indent}${sanitizeIdentifier(action.name)} = ${emitExpr(action.value)};\n`;
    case "change_variable":
      return `${indent}${sanitizeIdentifier(action.name)} += ${emitExpr(action.value)};\n`;

    case "set_visible":
      return `${indent}inst.visible = ${emitExpr(action.value)};\n`;
    case "set_size":
      return `${indent}inst.size = ${emitExpr(action.value)};\n`;

    case "create_instance":
      return `${indent}create(${JSON.stringify(action.spriteId)}, ${emitExpr(action.x)}, ${emitExpr(action.y)});\n`;
    case "destroy_instance":
      return `${indent}destroy();\n`;

    case "print":
      return `${indent}print(${emitExpr(action.message)});\n`;

    case "stop":
      return `${indent}return;\n`;
  }
}

function emitExpr(expr: Expression): string {
  switch (expr.type) {
    case "number":
      return String(expr.value);
    case "string":
      return JSON.stringify(expr.value);
    case "boolean":
      return expr.value ? "true" : "false";
    case "variable":
      return sanitizeIdentifier(expr.name);
    case "property":
      return `inst.${expr.property}`;
    case "arithmetic":
      return `(${emitExpr(expr.left)} ${expr.op} ${emitExpr(expr.right)})`;
    case "comparison":
      return `(${emitExpr(expr.left)} ${expr.op} ${emitExpr(expr.right)})`;
    case "logic":
      return `(${emitExpr(expr.left)} ${expr.op} ${emitExpr(expr.right)})`;
    case "not":
      return `(not ${emitExpr(expr.operand)})`;
    case "random":
      return `random(${emitExpr(expr.min)}, ${emitExpr(expr.max)})`;
    case "math_fn":
      // Block sin/cos take degrees; Hemlock builtins take radians.
      if (expr.fn === "sin" || expr.fn === "cos") {
        return `${expr.fn}(${emitExpr(expr.arg)} * ${DEG})`;
      }
      return `${expr.fn}(${emitExpr(expr.arg)})`;
  }
}
