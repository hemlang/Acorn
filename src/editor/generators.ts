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

  // Fallback: unknown block
  gen.scrub_ = function (
    this: Blockly.Generator,
    block: Blockly.Block,
    code: string,
    _thisOnly?: boolean
  ): string {
    const nextBlock = block.nextConnection?.targetBlock();
    if (nextBlock && !_thisOnly) {
      return code + this.blockToCode(nextBlock);
    }
    return code;
  };

  // ==================== EVENTS ====================

  gen.forBlock["event_create"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const body = this.statementToCode(block, "NEXT") || "";
    return `// on create\n${body}`;
  };

  gen.forBlock["event_step"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const body = this.statementToCode(block, "NEXT") || "";
    return `// every frame\n${body}`;
  };

  gen.forBlock["event_key_down"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const key = block.getFieldValue("KEY");
    const body = this.statementToCode(block, "NEXT") || "";
    return `// when "${key}" pressed\n${body}`;
  };

  gen.forBlock["event_key_pressed"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const key = block.getFieldValue("KEY");
    const body = this.statementToCode(block, "NEXT") || "";
    return `// while "${key}" held\n${body}`;
  };

  gen.forBlock["event_key_released"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const key = block.getFieldValue("KEY");
    const body = this.statementToCode(block, "NEXT") || "";
    return `// when "${key}" released\n${body}`;
  };

  // ==================== MOTION ====================

  gen.forBlock["motion_set_x"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.x = ${val};\n`;
  };

  gen.forBlock["motion_set_y"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.y = ${val};\n`;
  };

  gen.forBlock["motion_change_x"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.x += ${val};\n`;
  };

  gen.forBlock["motion_change_y"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.y += ${val};\n`;
  };

  gen.forBlock["motion_set_direction"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `inst.direction = ${val};\n`;
  };

  gen.forBlock["motion_move_forward"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
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
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const cond = this.valueToCode(block, "CONDITION", ORDER.NONE) || "false";
    const body = this.statementToCode(block, "DO") || "";
    return `if (${cond}) {\n${body}}\n`;
  };

  gen.forBlock["control_if_else"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const cond = this.valueToCode(block, "CONDITION", ORDER.NONE) || "false";
    const doBody = this.statementToCode(block, "DO") || "";
    const elseBody = this.statementToCode(block, "ELSE") || "";
    return `if (${cond}) {\n${doBody}} else {\n${elseBody}}\n`;
  };

  gen.forBlock["control_repeat"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const times = this.valueToCode(block, "TIMES", ORDER.NONE) || "10";
    const body = this.statementToCode(block, "DO") || "";
    return `for (i in range(${times})) {\n${body}}\n`;
  };

  gen.forBlock["control_while"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const cond = this.valueToCode(block, "CONDITION", ORDER.NONE) || "false";
    const body = this.statementToCode(block, "DO") || "";
    return `while (${cond}) {\n${body}}\n`;
  };

  gen.forBlock["control_stop"] = function (): string {
    return "return;\n";
  };

  // ==================== MATH / LOGIC ====================

  gen.forBlock["math_number_input"] = function (
    _this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    return [String(block.getFieldValue("NUM")), ORDER.ATOMIC];
  };

  gen.forBlock["math_arithmetic"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
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
    const a = this.valueToCode(block, "A", order) || "0";
    const b = this.valueToCode(block, "B", order) || "0";
    return [`${a} ${symbol} ${b}`, order];
  };

  gen.forBlock["math_comparison"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
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
    const a = this.valueToCode(block, "A", ORDER.COMPARE) || "0";
    const b = this.valueToCode(block, "B", ORDER.COMPARE) || "0";
    return [`${a} ${op} ${b}`, ORDER.COMPARE];
  };

  gen.forBlock["math_logic_op"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    const op = block.getFieldValue("OP") === "AND" ? "and" : "or";
    const a = this.valueToCode(block, "A", ORDER.LOGIC) || "false";
    const b = this.valueToCode(block, "B", ORDER.LOGIC) || "false";
    return [`${a} ${op} ${b}`, ORDER.LOGIC];
  };

  gen.forBlock["math_not"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    const val = this.valueToCode(block, "BOOL", ORDER.UNARY) || "false";
    return [`not ${val}`, ORDER.UNARY];
  };

  gen.forBlock["math_random"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    const min = this.valueToCode(block, "MIN", ORDER.NONE) || "1";
    const max = this.valueToCode(block, "MAX", ORDER.NONE) || "10";
    return [`random(${min}, ${max})`, ORDER.ATOMIC];
  };

  gen.forBlock["math_function"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    const fn = block.getFieldValue("FN") as string;
    const arg = this.valueToCode(block, "ARG", ORDER.NONE) || "0";
    return [`${fn}(${arg})`, ORDER.ATOMIC];
  };

  gen.forBlock["math_boolean"] = function (
    _this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    return [block.getFieldValue("BOOL") === "TRUE" ? "true" : "false", ORDER.ATOMIC];
  };

  // ==================== VARIABLES ====================

  gen.forBlock["var_set"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const name = block.getFieldValue("VAR");
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "0";
    return `${name} = ${val};\n`;
  };

  gen.forBlock["var_change"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const name = block.getFieldValue("VAR");
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "1";
    return `${name} += ${val};\n`;
  };

  gen.forBlock["var_get"] = function (
    _this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    return [block.getFieldValue("VAR") as string, ORDER.ATOMIC];
  };

  // ==================== APPEARANCE ====================

  gen.forBlock["appearance_set_visible"] = function (
    _this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = block.getFieldValue("VALUE") === "TRUE" ? "true" : "false";
    return `inst.visible = ${val};\n`;
  };

  gen.forBlock["appearance_set_size"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const val = this.valueToCode(block, "VALUE", ORDER.NONE) || "1";
    return `inst.size = ${val};\n`;
  };

  // ==================== INSTANCES ====================

  gen.forBlock["instance_create"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const sprite = block.getFieldValue("SPRITE");
    const x = this.valueToCode(block, "X", ORDER.NONE) || "0";
    const y = this.valueToCode(block, "Y", ORDER.NONE) || "0";
    return `create("${sprite}", ${x}, ${y});\n`;
  };

  gen.forBlock["instance_destroy"] = function (): string {
    return "destroy();\n";
  };

  // ==================== OUTPUT ====================

  gen.forBlock["output_print"] = function (
    this: Blockly.Generator,
    block: Blockly.Block
  ): string {
    const msg = this.valueToCode(block, "MSG", ORDER.NONE) || '""';
    return `print(${msg});\n`;
  };

  gen.forBlock["text_string"] = function (
    _this: Blockly.Generator,
    block: Blockly.Block
  ): [string, number] {
    const text = block.getFieldValue("TEXT") as string;
    return [`"${text.replace(/"/g, '\\"')}"`, ORDER.ATOMIC];
  };

  return gen;
}
