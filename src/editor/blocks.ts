/**
 * Blockly block definitions for Acorn.
 *
 * Five categories: Events, Motion, Control, Variables, Math/Logic.
 * ~40 blocks total for Phase 1.
 */

import * as Blockly from "blockly";

// Category colors (HSV hue values)
const EVENTS_HUE = 45;    // amber
const MOTION_HUE = 230;   // blue
const CONTROL_HUE = 120;  // green
const MATH_HUE = 270;     // purple
const APPEARANCE_HUE = 330; // pink
const INSTANCE_HUE = 20;  // red-orange
const OUTPUT_HUE = 160;   // teal

export function registerBlocks(): void {
  // ==================== EVENTS ====================

  Blockly.Blocks["event_create"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("when created");
      this.setNextStatement(true, null);
      this.setColour(EVENTS_HUE);
      this.setTooltip("Runs once when this instance is created");
      this.setDeletable(false);
    },
  };

  Blockly.Blocks["event_step"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("every frame");
      this.setNextStatement(true, null);
      this.setColour(EVENTS_HUE);
      this.setTooltip("Runs every frame (60 times per second)");
      this.setDeletable(false);
    },
  };

  Blockly.Blocks["event_key_down"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField("when")
        .appendField(
          new Blockly.FieldDropdown(KEY_OPTIONS),
          "KEY"
        )
        .appendField("pressed");
      this.setNextStatement(true, null);
      this.setColour(EVENTS_HUE);
      this.setTooltip("Runs once when the key is first pressed down");
    },
  };

  Blockly.Blocks["event_key_pressed"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField("while")
        .appendField(
          new Blockly.FieldDropdown(KEY_OPTIONS),
          "KEY"
        )
        .appendField("held");
      this.setNextStatement(true, null);
      this.setColour(EVENTS_HUE);
      this.setTooltip("Runs every frame while the key is held down");
    },
  };

  Blockly.Blocks["event_key_released"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField("when")
        .appendField(
          new Blockly.FieldDropdown(KEY_OPTIONS),
          "KEY"
        )
        .appendField("released");
      this.setNextStatement(true, null);
      this.setColour(EVENTS_HUE);
      this.setTooltip("Runs once when the key is released");
    },
  };

  // ==================== MOTION ====================

  Blockly.Blocks["motion_set_x"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("set x to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(MOTION_HUE);
      this.setTooltip("Set the horizontal position");
    },
  };

  Blockly.Blocks["motion_set_y"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("set y to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(MOTION_HUE);
      this.setTooltip("Set the vertical position");
    },
  };

  Blockly.Blocks["motion_change_x"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("change x by");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(MOTION_HUE);
      this.setTooltip("Change horizontal position by an amount");
    },
  };

  Blockly.Blocks["motion_change_y"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("change y by");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(MOTION_HUE);
      this.setTooltip("Change vertical position by an amount");
    },
  };

  Blockly.Blocks["motion_set_direction"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("set direction to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(MOTION_HUE);
      this.setTooltip("Set direction in degrees (0 = right, 90 = down)");
    },
  };

  Blockly.Blocks["motion_move_forward"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("move forward");
      this.appendDummyInput().appendField("steps");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(MOTION_HUE);
      this.setTooltip("Move forward in the current direction");
    },
  };

  Blockly.Blocks["motion_get_x"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("x position");
      this.setOutput(true, "Number");
      this.setColour(MOTION_HUE);
      this.setTooltip("Current horizontal position");
    },
  };

  Blockly.Blocks["motion_get_y"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("y position");
      this.setOutput(true, "Number");
      this.setColour(MOTION_HUE);
      this.setTooltip("Current vertical position");
    },
  };

  Blockly.Blocks["motion_get_direction"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("direction");
      this.setOutput(true, "Number");
      this.setColour(MOTION_HUE);
      this.setTooltip("Current direction in degrees");
    },
  };

  // ==================== CONTROL ====================

  Blockly.Blocks["control_if"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CONTROL_HUE);
      this.setTooltip("Run blocks if condition is true");
    },
  };

  Blockly.Blocks["control_if_else"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("if");
      this.appendStatementInput("DO").appendField("do");
      this.appendStatementInput("ELSE").appendField("else");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CONTROL_HUE);
      this.setTooltip("Run blocks if condition is true, otherwise run else blocks");
    },
  };

  Blockly.Blocks["control_repeat"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("TIMES")
        .setCheck("Number")
        .appendField("repeat");
      this.appendDummyInput().appendField("times");
      this.appendStatementInput("DO");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CONTROL_HUE);
      this.setTooltip("Repeat the blocks a number of times");
    },
  };

  Blockly.Blocks["control_while"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("CONDITION")
        .setCheck("Boolean")
        .appendField("while");
      this.appendStatementInput("DO").appendField("do");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(CONTROL_HUE);
      this.setTooltip("Repeat while condition is true");
    },
  };

  Blockly.Blocks["control_stop"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("stop this script");
      this.setPreviousStatement(true, null);
      this.setColour(CONTROL_HUE);
      this.setTooltip("Stop running this event handler");
    },
  };

  // ==================== MATH / LOGIC ====================

  Blockly.Blocks["math_number_input"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(
        new Blockly.FieldNumber(0),
        "NUM"
      );
      this.setOutput(true, "Number");
      this.setColour(MATH_HUE);
      this.setTooltip("A number");
    },
  };

  Blockly.Blocks["math_arithmetic"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["+", "ADD"],
          ["\u2212", "SUB"],
          ["\u00D7", "MUL"],
          ["\u00F7", "DIV"],
          ["mod", "MOD"],
        ]),
        "OP"
      );
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(MATH_HUE);
      this.setTooltip("Arithmetic operation");
    },
  };

  Blockly.Blocks["math_comparison"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("A").setCheck("Number");
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["=", "EQ"],
          ["\u2260", "NEQ"],
          ["<", "LT"],
          [">", "GT"],
          ["\u2264", "LTE"],
          ["\u2265", "GTE"],
        ]),
        "OP"
      );
      this.appendValueInput("B").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(MATH_HUE);
      this.setTooltip("Compare two numbers");
    },
  };

  Blockly.Blocks["math_logic_op"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("A").setCheck("Boolean");
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["and", "AND"],
          ["or", "OR"],
        ]),
        "OP"
      );
      this.appendValueInput("B").setCheck("Boolean");
      this.setInputsInline(true);
      this.setOutput(true, "Boolean");
      this.setColour(MATH_HUE);
      this.setTooltip("Logical operation");
    },
  };

  Blockly.Blocks["math_not"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("BOOL").setCheck("Boolean").appendField("not");
      this.setOutput(true, "Boolean");
      this.setColour(MATH_HUE);
      this.setTooltip("Logical NOT");
    },
  };

  Blockly.Blocks["math_random"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("random");
      this.appendValueInput("MIN").setCheck("Number");
      this.appendDummyInput().appendField("to");
      this.appendValueInput("MAX").setCheck("Number");
      this.setInputsInline(true);
      this.setOutput(true, "Number");
      this.setColour(MATH_HUE);
      this.setTooltip("Random integer between min and max");
    },
  };

  Blockly.Blocks["math_function"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("ARG")
        .setCheck("Number")
        .appendField(
          new Blockly.FieldDropdown([
            ["abs", "abs"],
            ["round", "round"],
            ["floor", "floor"],
            ["ceil", "ceil"],
            ["sqrt", "sqrt"],
            ["sin", "sin"],
            ["cos", "cos"],
          ]),
          "FN"
        )
        .appendField("of");
      this.setOutput(true, "Number");
      this.setColour(MATH_HUE);
      this.setTooltip("Math function");
    },
  };

  Blockly.Blocks["math_boolean"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(
        new Blockly.FieldDropdown([
          ["true", "TRUE"],
          ["false", "FALSE"],
        ]),
        "BOOL"
      );
      this.setOutput(true, "Boolean");
      this.setColour(MATH_HUE);
      this.setTooltip("Boolean value");
    },
  };

  // ==================== VARIABLES ====================
  // We use custom variable blocks instead of Blockly's built-in ones
  // to generate Hemlock-compatible code.

  Blockly.Blocks["var_set"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .appendField("set")
        .appendField(new Blockly.FieldTextInput("my_var"), "VAR")
        .appendField("to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
      this.setTooltip("Set a variable to a value");
    },
  };

  Blockly.Blocks["var_change"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .appendField("change")
        .appendField(new Blockly.FieldTextInput("my_var"), "VAR")
        .appendField("by");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(20);
      this.setTooltip("Change a variable by an amount");
    },
  };

  Blockly.Blocks["var_get"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField("get")
        .appendField(new Blockly.FieldTextInput("my_var"), "VAR");
      this.setOutput(true, null);
      this.setColour(20);
      this.setTooltip("Get the value of a variable");
    },
  };

  // ==================== APPEARANCE ====================

  Blockly.Blocks["appearance_set_visible"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField("set visible to")
        .appendField(
          new Blockly.FieldDropdown([
            ["true", "TRUE"],
            ["false", "FALSE"],
          ]),
          "VALUE"
        );
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(APPEARANCE_HUE);
      this.setTooltip("Show or hide this instance");
    },
  };

  Blockly.Blocks["appearance_set_size"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("VALUE")
        .setCheck("Number")
        .appendField("set size to");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(APPEARANCE_HUE);
      this.setTooltip("Set the size multiplier (1 = normal)");
    },
  };

  // ==================== INSTANCES ====================

  Blockly.Blocks["instance_create"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput()
        .appendField("create")
        .appendField(new Blockly.FieldTextInput("Sprite"), "SPRITE");
      this.appendValueInput("X").setCheck("Number").appendField("at x:");
      this.appendValueInput("Y").setCheck("Number").appendField("y:");
      this.setInputsInline(true);
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(INSTANCE_HUE);
      this.setTooltip("Create a new instance of a sprite");
    },
  };

  Blockly.Blocks["instance_destroy"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField("destroy this instance");
      this.setPreviousStatement(true, null);
      this.setColour(INSTANCE_HUE);
      this.setTooltip("Remove this instance from the game");
    },
  };

  // ==================== OUTPUT ====================

  Blockly.Blocks["output_print"] = {
    init(this: Blockly.Block) {
      this.appendValueInput("MSG").appendField("print");
      this.setPreviousStatement(true, null);
      this.setNextStatement(true, null);
      this.setColour(OUTPUT_HUE);
      this.setTooltip("Print a message to the debug console");
    },
  };

  // ==================== STRING ====================

  Blockly.Blocks["text_string"] = {
    init(this: Blockly.Block) {
      this.appendDummyInput().appendField(
        new Blockly.FieldTextInput("hello"),
        "TEXT"
      );
      this.setOutput(true, "String");
      this.setColour(OUTPUT_HUE);
      this.setTooltip("A text string");
    },
  };
}

/** Common key dropdown options. */
const KEY_OPTIONS: Array<[string, string]> = [
  ["left arrow", "ArrowLeft"],
  ["right arrow", "ArrowRight"],
  ["up arrow", "ArrowUp"],
  ["down arrow", "ArrowDown"],
  ["space", " "],
  ["a", "a"],
  ["b", "b"],
  ["c", "c"],
  ["d", "d"],
  ["e", "e"],
  ["f", "f"],
  ["g", "g"],
  ["h", "h"],
  ["i", "i"],
  ["j", "j"],
  ["k", "k"],
  ["l", "l"],
  ["m", "m"],
  ["n", "n"],
  ["o", "o"],
  ["p", "p"],
  ["q", "q"],
  ["r", "r"],
  ["s", "s"],
  ["t", "t"],
  ["u", "u"],
  ["v", "v"],
  ["w", "w"],
  ["x", "x"],
  ["y", "y"],
  ["z", "z"],
  ["0", "0"],
  ["1", "1"],
  ["2", "2"],
  ["3", "3"],
  ["4", "4"],
  ["5", "5"],
  ["6", "6"],
  ["7", "7"],
  ["8", "8"],
  ["9", "9"],
  ["enter", "Enter"],
  ["shift", "Shift"],
];
