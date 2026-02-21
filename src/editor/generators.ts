/**
 * Hemlock source code generator for Blockly blocks.
 *
 * Produces readable Hemlock code for the code preview panel.
 * This is display-only in Phase 1; execution uses the block compiler.
 */

import * as Blockly from "blockly";

/** Operator precedence levels for code generation. */
const ORDER = {
  ATOMIC: 0,
  UNARY: 1,
  MULTIPLY: 2,
  ADD: 3,
  COMPARE: 4,
  LOGIC: 5,
  NONE: 99,
};

export function createHemlockGenerator(): Blockly.Generator {
  const gen = new Blockly.Generator("Hemlock");

  // Use indentation
  gen.INDENT = "  ";

  // Fallback: append next block's code
  gen.scrub_ = function (
    _block: Blockly.Block,
    code: string,
    _thisOnly?: boolean
  ): string {
    const nextBlock = _block.nextConnection?.targetBlock();
    if (nextBlock && !_thisOnly) {
      return code + gen.blockToCode(nextBlock);
    }
    return code;
  };

  // ==================== EVENTS ====================

  gen.forBlock["event_create"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const body = generator.statementToCode(block, "NEXT") || "";
    return `// on create\n${body}`;
  };

  gen.forBlock["event_step"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const body = generator.statementToCode(block, "NEXT") || "";
    return `// every frame\n${body}`;
  };

  gen.forBlock["event_key_down"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const key = block.getFieldValue("KEY");
    const body = generator.statementToCode(block, "NEXT") || "";
    return `// when "${key}" pressed\n${body}`;
  };

  gen.forBlock["event_key_pressed"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const key = block.getFieldValue("KEY");
    const body = generator.statementToCode(block, "NEXT") || "";
    return `// while "${key}" held\n${body}`;
  };

  gen.forBlock["event_key_released"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const key = block.getFieldValue("KEY");
    const body = generator.statementToCode(block, "NEXT") || "";
    return `// when "${key}" released\n${body}`;
  };

  // ==================== MOTION ====================

  gen.forBlock["motion_set_x"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.x = ${val};\n`;
  };

  gen.forBlock["motion_set_y"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.y = ${val};\n`;
  };

  gen.forBlock["motion_change_x"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.x += ${val};\n`;
  };

  gen.forBlock["motion_change_y"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.y += ${val};\n`;
  };

  gen.forBlock["motion_set_direction"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.direction = ${val};\n`;
  };

  gen.forBlock["motion_move_forward"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.x += ${val} * cos(inst.direction);\ninst.y += ${val} * sin(inst.direction);\n`;
  };

  gen.forBlock["motion_get_x"] = function (): [string, number] {
    return ["inst.x", ORDER.ATOMIC];
  };

  gen.forBlock["motion_get_y"] = function (): [string, number] {
    return ["inst.y", ORDER.ATOMIC];
  };

  gen.forBlock["motion_get_direction"] = function (): [string, number] {
    return ["inst.direction", ORDER.ATOMIC];
  };

  // ==================== CONTROL ====================

  gen.forBlock["control_if"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const cond =
      generator.valueToCode(block, "CONDITION", ORDER.NONE) || "false";
    const body = generator.statementToCode(block, "DO") || "";
    return `if (${cond}) {\n${body}}\n`;
  };

  gen.forBlock["control_if_else"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const cond =
      generator.valueToCode(block, "CONDITION", ORDER.NONE) || "false";
    const doBody = generator.statementToCode(block, "DO") || "";
    const elseBody = generator.statementToCode(block, "ELSE") || "";
    return `if (${cond}) {\n${doBody}} else {\n${elseBody}}\n`;
  };

  gen.forBlock["control_repeat"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const times = generator.valueToCode(block, "TIMES", ORDER.NONE) || "10";
    const body = generator.statementToCode(block, "DO") || "";
    return `for (i in range(${times})) {\n${body}}\n`;
  };

  gen.forBlock["control_while"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const cond =
      generator.valueToCode(block, "CONDITION", ORDER.NONE) || "false";
    const body = generator.statementToCode(block, "DO") || "";
    return `while (${cond}) {\n${body}}\n`;
  };

  gen.forBlock["control_stop"] = function (): string {
    return "return;\n";
  };

  // ==================== MATH / LOGIC ====================

  gen.forBlock["math_number_input"] = function (
    block: Blockly.Block
  ): [string, number] {
    return [String(block.getFieldValue("NUM")), ORDER.ATOMIC];
  };

  gen.forBlock["math_arithmetic"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): [string, number] {
    const opMap: Record<string, [string, number]> = {
      ADD: ["+", ORDER.ADD],
      SUB: ["-", ORDER.ADD],
      MUL: ["*", ORDER.MULTIPLY],
      DIV: ["/", ORDER.MULTIPLY],
      MOD: ["%", ORDER.MULTIPLY],
    };
    const op = block.getFieldValue("OP") as string;
    const [symbol, order] = opMap[op] || ["+", ORDER.ADD];
    const a = generator.valueToCode(block, "A", order) || "0";
    const b = generator.valueToCode(block, "B", order) || "0";
    return [`${a} ${symbol} ${b}`, order];
  };

  gen.forBlock["math_comparison"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): [string, number] {
    const opMap: Record<string, string> = {
      EQ: "==",
      NEQ: "!=",
      LT: "<",
      GT: ">",
      LTE: "<=",
      GTE: ">=",
    };
    const op = opMap[block.getFieldValue("OP") as string] || "==";
    const a = generator.valueToCode(block, "A", ORDER.COMPARE) || "0";
    const b = generator.valueToCode(block, "B", ORDER.COMPARE) || "0";
    return [`${a} ${op} ${b}`, ORDER.COMPARE];
  };

  gen.forBlock["math_logic_op"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): [string, number] {
    const op = block.getFieldValue("OP") === "AND" ? "and" : "or";
    const a = generator.valueToCode(block, "A", ORDER.LOGIC) || "false";
    const b = generator.valueToCode(block, "B", ORDER.LOGIC) || "false";
    return [`${a} ${op} ${b}`, ORDER.LOGIC];
  };

  gen.forBlock["math_not"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): [string, number] {
    const val =
      generator.valueToCode(block, "BOOL", ORDER.UNARY) || "false";
    return [`not ${val}`, ORDER.UNARY];
  };

  gen.forBlock["math_random"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): [string, number] {
    const min = generator.valueToCode(block, "MIN", ORDER.NONE) || "1";
    const max = generator.valueToCode(block, "MAX", ORDER.NONE) || "10";
    return [`random(${min}, ${max})`, ORDER.ATOMIC];
  };

  gen.forBlock["math_function"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): [string, number] {
    const fn = block.getFieldValue("FN") as string;
    const arg = generator.valueToCode(block, "ARG", ORDER.NONE) || "0";
    return [`${fn}(${arg})`, ORDER.ATOMIC];
  };

  gen.forBlock["math_boolean"] = function (
    block: Blockly.Block
  ): [string, number] {
    return [
      block.getFieldValue("BOOL") === "TRUE" ? "true" : "false",
      ORDER.ATOMIC,
    ];
  };

  // ==================== VARIABLES ====================

  gen.forBlock["var_set"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const name = block.getFieldValue("VAR");
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `${name} = ${val};\n`;
  };

  gen.forBlock["var_change"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const name = block.getFieldValue("VAR");
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "1";
    return `${name} += ${val};\n`;
  };

  gen.forBlock["var_get"] = function (
    block: Blockly.Block
  ): [string, number] {
    return [block.getFieldValue("VAR") as string, ORDER.ATOMIC];
  };

  // ==================== APPEARANCE ====================

  gen.forBlock["appearance_set_visible"] = function (
    block: Blockly.Block
  ): string {
    const val = block.getFieldValue("VALUE") === "TRUE" ? "true" : "false";
    return `inst.visible = ${val};\n`;
  };

  gen.forBlock["appearance_set_size"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const val = generator.valueToCode(block, "VALUE", ORDER.NONE) || "1";
    return `inst.size = ${val};\n`;
  };

  // ==================== INSTANCES ====================

  gen.forBlock["instance_create"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const sprite = block.getFieldValue("SPRITE");
    const x = generator.valueToCode(block, "X", ORDER.NONE) || "0";
    const y = generator.valueToCode(block, "Y", ORDER.NONE) || "0";
    return `create("${sprite}", ${x}, ${y});\n`;
  };

  gen.forBlock["instance_destroy"] = function (): string {
    return "destroy();\n";
  };

  // ==================== OUTPUT ====================

  gen.forBlock["output_print"] = function (
    block: Blockly.Block,
    generator: Blockly.Generator
  ): string {
    const msg = generator.valueToCode(block, "MSG", ORDER.NONE) || '""';
    return `print(${msg});\n`;
  };

  gen.forBlock["text_string"] = function (
    block: Blockly.Block
  ): [string, number] {
    const text = block.getFieldValue("TEXT") as string;
    return [`"${text.replace(/"/g, '\\"')}"`, ORDER.ATOMIC];
  };

  return gen;
}
