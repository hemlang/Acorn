/**
 * Block compiler: converts Blockly workspace blocks into executable
 * BlockAction/Expression trees for the game runtime interpreter.
 *
 * This allows execution without the Hemlock WASM interpreter in Phase 1.
 */

import * as Blockly from "blockly";
import {
  BlockAction,
  Expression,
  CompiledHandler,
  CompiledSprite,
  EventType,
} from "../runtime/types.js";

/**
 * Compile all event handler scripts in a Blockly workspace
 * into a CompiledSprite for the game runtime.
 */
export function compileWorkspace(
  workspace: Blockly.Workspace,
  spriteId: string
): CompiledSprite {
  const handlers: CompiledHandler[] = [];
  const topBlocks = workspace.getTopBlocks(true);

  for (const block of topBlocks) {
    const handler = compileEventBlock(block);
    if (handler) {
      handlers.push(handler);
    }
  }

  return { spriteId, handlers };
}

/** Compile a top-level event hat block and its chain into a handler. */
function compileEventBlock(block: Blockly.Block): CompiledHandler | null {
  let event: EventType;
  let key: string | undefined;

  switch (block.type) {
    case "event_create":
      event = "create";
      break;
    case "event_step":
      event = "step";
      break;
    case "event_key_down":
      event = "key_down";
      key = block.getFieldValue("KEY") as string;
      break;
    case "event_key_pressed":
      event = "key_pressed";
      key = block.getFieldValue("KEY") as string;
      break;
    case "event_key_released":
      event = "key_released";
      key = block.getFieldValue("KEY") as string;
      break;
    default:
      // Not an event block; skip
      return null;
  }

  const actions = compileChain(block.getNextBlock());
  return { event, key, actions };
}

/** Compile a chain of statement blocks into a list of actions. */
function compileChain(block: Blockly.Block | null): BlockAction[] {
  const actions: BlockAction[] = [];
  let current = block;

  while (current) {
    const action = compileStatement(current);
    if (action) {
      actions.push(action);
    }
    current = current.getNextBlock();
  }

  return actions;
}

/** Compile a single statement block into a BlockAction. */
function compileStatement(block: Blockly.Block): BlockAction | null {
  switch (block.type) {
    // Motion
    case "motion_set_x":
      return { type: "set_x", value: compileValue(block, "VALUE", num(0)) };
    case "motion_set_y":
      return { type: "set_y", value: compileValue(block, "VALUE", num(0)) };
    case "motion_change_x":
      return { type: "change_x", value: compileValue(block, "VALUE", num(0)) };
    case "motion_change_y":
      return { type: "change_y", value: compileValue(block, "VALUE", num(0)) };
    case "motion_set_direction":
      return {
        type: "set_direction",
        value: compileValue(block, "VALUE", num(0)),
      };
    case "motion_move_forward":
      return {
        type: "move_forward",
        value: compileValue(block, "VALUE", num(0)),
      };

    // Control
    case "control_if":
      return {
        type: "if",
        condition: compileValue(block, "CONDITION", bool(false)),
        body: compileStatementInput(block, "DO"),
      };
    case "control_if_else":
      return {
        type: "if_else",
        condition: compileValue(block, "CONDITION", bool(false)),
        thenBody: compileStatementInput(block, "DO"),
        elseBody: compileStatementInput(block, "ELSE"),
      };
    case "control_repeat":
      return {
        type: "repeat",
        count: compileValue(block, "TIMES", num(10)),
        body: compileStatementInput(block, "DO"),
      };
    case "control_while":
      return {
        type: "while",
        condition: compileValue(block, "CONDITION", bool(false)),
        body: compileStatementInput(block, "DO"),
      };
    case "control_stop":
      return { type: "stop" };

    // Variables
    case "var_set":
      return {
        type: "set_variable",
        name: block.getFieldValue("VAR") as string,
        value: compileValue(block, "VALUE", num(0)),
      };
    case "var_change":
      return {
        type: "change_variable",
        name: block.getFieldValue("VAR") as string,
        value: compileValue(block, "VALUE", num(1)),
      };

    // Appearance
    case "appearance_set_visible":
      return {
        type: "set_visible",
        value: bool(block.getFieldValue("VALUE") === "TRUE"),
      };
    case "appearance_set_size":
      return {
        type: "set_size",
        value: compileValue(block, "VALUE", num(1)),
      };

    // Instances
    case "instance_create":
      return {
        type: "create_instance",
        spriteId: block.getFieldValue("SPRITE") as string,
        x: compileValue(block, "X", num(0)),
        y: compileValue(block, "Y", num(0)),
      };
    case "instance_destroy":
      return { type: "destroy_instance" };

    // Output
    case "output_print":
      return {
        type: "print",
        message: compileValue(block, "MSG", { type: "string", value: "" }),
      };

    default:
      return null;
  }
}

/** Compile a value input on a block into an Expression. */
function compileValue(
  block: Blockly.Block,
  inputName: string,
  defaultExpr: Expression
): Expression {
  const input = block.getInput(inputName);
  if (!input) return defaultExpr;

  const connectedBlock = input.connection?.targetBlock();
  if (!connectedBlock) {
    // Check for shadow blocks
    const shadowBlock = input.connection?.getShadowState();
    if (shadowBlock) {
      return compileShadow(shadowBlock);
    }
    return defaultExpr;
  }

  return compileExpression(connectedBlock);
}

/** Compile a shadow block state into an expression. */
function compileShadow(shadow: Blockly.serialization.blocks.ConnectionState): Expression {
  if (shadow.type === "math_number_input" && shadow.fields) {
    const numField = shadow.fields as Record<string, unknown>;
    return num(Number(numField["NUM"]) || 0);
  }
  return num(0);
}

/** Compile a value block into an Expression. */
function compileExpression(block: Blockly.Block): Expression {
  switch (block.type) {
    case "math_number_input":
      return num(Number(block.getFieldValue("NUM")) || 0);

    case "math_arithmetic": {
      const opMap: Record<string, "+" | "-" | "*" | "/" | "%"> = {
        ADD: "+",
        SUB: "-",
        MUL: "*",
        DIV: "/",
        MOD: "%",
      };
      return {
        type: "arithmetic",
        op: opMap[block.getFieldValue("OP") as string] || "+",
        left: compileValue(block, "A", num(0)),
        right: compileValue(block, "B", num(0)),
      };
    }

    case "math_comparison": {
      const cmpMap: Record<string, "==" | "!=" | "<" | ">" | "<=" | ">="> = {
        EQ: "==",
        NEQ: "!=",
        LT: "<",
        GT: ">",
        LTE: "<=",
        GTE: ">=",
      };
      return {
        type: "comparison",
        op: cmpMap[block.getFieldValue("OP") as string] || "==",
        left: compileValue(block, "A", num(0)),
        right: compileValue(block, "B", num(0)),
      };
    }

    case "math_logic_op":
      return {
        type: "logic",
        op: block.getFieldValue("OP") === "AND" ? "and" : "or",
        left: compileValue(block, "A", bool(false)),
        right: compileValue(block, "B", bool(false)),
      };

    case "math_not":
      return {
        type: "not",
        operand: compileValue(block, "BOOL", bool(false)),
      };

    case "math_random":
      return {
        type: "random",
        min: compileValue(block, "MIN", num(1)),
        max: compileValue(block, "MAX", num(10)),
      };

    case "math_function":
      return {
        type: "math_fn",
        fn: block.getFieldValue("FN") as Expression & { type: "math_fn" } extends { fn: infer F } ? F : never,
        arg: compileValue(block, "ARG", num(0)),
      };

    case "math_boolean":
      return bool(block.getFieldValue("BOOL") === "TRUE");

    case "var_get":
      return {
        type: "variable",
        name: block.getFieldValue("VAR") as string,
      };

    case "motion_get_x":
      return { type: "property", property: "x" };
    case "motion_get_y":
      return { type: "property", property: "y" };
    case "motion_get_direction":
      return { type: "property", property: "direction" };

    case "text_string":
      return {
        type: "string",
        value: block.getFieldValue("TEXT") as string,
      };

    default:
      return num(0);
  }
}

/** Compile a statement input (nested blocks). */
function compileStatementInput(
  block: Blockly.Block,
  inputName: string
): BlockAction[] {
  const input = block.getInput(inputName);
  if (!input) return [];
  const firstBlock = input.connection?.targetBlock();
  return compileChain(firstBlock ?? null);
}

// Shorthand constructors
function num(value: number): Expression {
  return { type: "number", value };
}

function bool(value: boolean): Expression {
  return { type: "boolean", value };
}
