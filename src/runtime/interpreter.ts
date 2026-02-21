/**
 * Block action interpreter: executes compiled BlockActions against game instances.
 *
 * This is the Phase 1 execution engine. It directly interprets the BlockAction
 * tree without going through the Hemlock WASM interpreter.
 */

import { BlockAction, Expression, GameInstance, GameState } from "./types.js";

/** Sentinel thrown to stop script execution. */
class StopSignal {
  readonly isStop = true;
}

/** Maximum loop iterations to prevent infinite loops. */
const MAX_ITERATIONS = 10_000;

/** Per-instance execution context (local variables, output). */
export interface ExecContext {
  instance: GameInstance;
  state: GameState;
  variables: Record<string, number | string | boolean>;
  output: string[];
}

/**
 * Execute a list of actions in the context of a specific instance.
 * Returns any output messages (from print blocks).
 */
export function executeActions(
  actions: BlockAction[],
  instance: GameInstance,
  state: GameState
): string[] {
  const ctx: ExecContext = {
    instance,
    state,
    variables: { ...instance.variables },
    output: [],
  };

  try {
    runActions(actions, ctx);
  } catch (e) {
    if (!(e instanceof StopSignal)) {
      ctx.output.push(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Write variables back to instance
  instance.variables = ctx.variables;

  return ctx.output;
}

function runActions(actions: BlockAction[], ctx: ExecContext): void {
  for (const action of actions) {
    runAction(action, ctx);
  }
}

function runAction(action: BlockAction, ctx: ExecContext): void {
  const inst = ctx.instance;

  switch (action.type) {
    case "set_x":
      inst.x = evalNum(action.value, ctx);
      break;

    case "set_y":
      inst.y = evalNum(action.value, ctx);
      break;

    case "change_x":
      inst.x += evalNum(action.value, ctx);
      break;

    case "change_y":
      inst.y += evalNum(action.value, ctx);
      break;

    case "set_direction":
      inst.direction = evalNum(action.value, ctx);
      break;

    case "move_forward": {
      const dist = evalNum(action.value, ctx);
      const rad = (inst.direction * Math.PI) / 180;
      inst.x += dist * Math.cos(rad);
      inst.y += dist * Math.sin(rad);
      break;
    }

    case "if":
      if (evalBool(action.condition, ctx)) {
        runActions(action.body, ctx);
      }
      break;

    case "if_else":
      if (evalBool(action.condition, ctx)) {
        runActions(action.thenBody, ctx);
      } else {
        runActions(action.elseBody, ctx);
      }
      break;

    case "repeat": {
      const count = Math.min(evalNum(action.count, ctx), MAX_ITERATIONS);
      for (let i = 0; i < count; i++) {
        runActions(action.body, ctx);
      }
      break;
    }

    case "while": {
      let iterations = 0;
      while (evalBool(action.condition, ctx)) {
        runActions(action.body, ctx);
        iterations++;
        if (iterations >= MAX_ITERATIONS) {
          ctx.output.push(
            "Warning: Loop exceeded maximum iterations and was stopped."
          );
          break;
        }
      }
      break;
    }

    case "set_variable":
      ctx.variables[action.name] = evalAny(action.value, ctx);
      break;

    case "change_variable": {
      const current = Number(ctx.variables[action.name]) || 0;
      ctx.variables[action.name] = current + evalNum(action.value, ctx);
      break;
    }

    case "set_visible":
      inst.visible = evalBool(action.value, ctx);
      break;

    case "set_size":
      inst.size = evalNum(action.value, ctx);
      break;

    case "create_instance":
      ctx.state.pendingCreations.push({
        spriteId: action.spriteId,
        x: evalNum(action.x, ctx),
        y: evalNum(action.y, ctx),
      });
      break;

    case "destroy_instance":
      inst.destroyed = true;
      break;

    case "print":
      ctx.output.push(String(evalAny(action.message, ctx)));
      break;

    case "stop":
      throw new StopSignal();
  }
}

/** Evaluate an expression and coerce to number. */
function evalNum(expr: Expression, ctx: ExecContext): number {
  const val = evalAny(expr, ctx);
  return typeof val === "number" ? val : Number(val) || 0;
}

/** Evaluate an expression and coerce to boolean. */
function evalBool(expr: Expression, ctx: ExecContext): boolean {
  const val = evalAny(expr, ctx);
  return Boolean(val);
}

/** Evaluate an expression to its raw value. */
function evalAny(
  expr: Expression,
  ctx: ExecContext
): number | string | boolean {
  switch (expr.type) {
    case "number":
      return expr.value;

    case "string":
      return expr.value;

    case "boolean":
      return expr.value;

    case "variable":
      return ctx.variables[expr.name] ?? 0;

    case "property":
      switch (expr.property) {
        case "x":
          return ctx.instance.x;
        case "y":
          return ctx.instance.y;
        case "direction":
          return ctx.instance.direction;
        case "speed":
          return ctx.instance.speed;
        case "visible":
          return ctx.instance.visible;
        case "size":
          return ctx.instance.size;
      }
      break;

    case "arithmetic": {
      const a = evalNum(expr.left, ctx);
      const b = evalNum(expr.right, ctx);
      switch (expr.op) {
        case "+":
          return a + b;
        case "-":
          return a - b;
        case "*":
          return a * b;
        case "/":
          return b !== 0 ? a / b : 0;
        case "%":
          return b !== 0 ? a % b : 0;
      }
      break;
    }

    case "comparison": {
      const a = evalNum(expr.left, ctx);
      const b = evalNum(expr.right, ctx);
      switch (expr.op) {
        case "==":
          return a === b;
        case "!=":
          return a !== b;
        case "<":
          return a < b;
        case ">":
          return a > b;
        case "<=":
          return a <= b;
        case ">=":
          return a >= b;
      }
      break;
    }

    case "logic": {
      const a = evalBool(expr.left, ctx);
      const b = evalBool(expr.right, ctx);
      return expr.op === "and" ? a && b : a || b;
    }

    case "not":
      return !evalBool(expr.operand, ctx);

    case "random": {
      const min = Math.ceil(evalNum(expr.min, ctx));
      const max = Math.floor(evalNum(expr.max, ctx));
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    case "math_fn": {
      const arg = evalNum(expr.arg, ctx);
      switch (expr.fn) {
        case "abs":
          return Math.abs(arg);
        case "round":
          return Math.round(arg);
        case "floor":
          return Math.floor(arg);
        case "ceil":
          return Math.ceil(arg);
        case "sqrt":
          return Math.sqrt(arg);
        case "sin":
          return Math.sin((arg * Math.PI) / 180);
        case "cos":
          return Math.cos((arg * Math.PI) / 180);
      }
      break;
    }
  }

  return 0;
}
