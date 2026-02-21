/**
 * Blockly toolbox configuration for the Acorn block editor.
 *
 * Defines the category structure and which blocks appear in each.
 */

export const TOOLBOX_CONFIG = {
  kind: "categoryToolbox",
  contents: [
    {
      kind: "category",
      name: "Events",
      colour: "45",
      contents: [
        { kind: "block", type: "event_create" },
        { kind: "block", type: "event_step" },
        { kind: "block", type: "event_key_down" },
        { kind: "block", type: "event_key_pressed" },
        { kind: "block", type: "event_key_released" },
      ],
    },
    {
      kind: "category",
      name: "Motion",
      colour: "230",
      contents: [
        {
          kind: "block",
          type: "motion_set_x",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 0 } },
            },
          },
        },
        {
          kind: "block",
          type: "motion_set_y",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 0 } },
            },
          },
        },
        {
          kind: "block",
          type: "motion_change_x",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 5 } },
            },
          },
        },
        {
          kind: "block",
          type: "motion_change_y",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 5 } },
            },
          },
        },
        {
          kind: "block",
          type: "motion_set_direction",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 0 } },
            },
          },
        },
        {
          kind: "block",
          type: "motion_move_forward",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 5 } },
            },
          },
        },
        { kind: "block", type: "motion_get_x" },
        { kind: "block", type: "motion_get_y" },
        { kind: "block", type: "motion_get_direction" },
      ],
    },
    {
      kind: "category",
      name: "Appearance",
      colour: "330",
      contents: [
        { kind: "block", type: "appearance_set_visible" },
        {
          kind: "block",
          type: "appearance_set_size",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 1 } },
            },
          },
        },
      ],
    },
    {
      kind: "category",
      name: "Control",
      colour: "120",
      contents: [
        { kind: "block", type: "control_if" },
        { kind: "block", type: "control_if_else" },
        {
          kind: "block",
          type: "control_repeat",
          inputs: {
            TIMES: {
              shadow: { type: "math_number_input", fields: { NUM: 10 } },
            },
          },
        },
        { kind: "block", type: "control_while" },
        { kind: "block", type: "control_stop" },
      ],
    },
    {
      kind: "category",
      name: "Variables",
      colour: "20",
      contents: [
        {
          kind: "block",
          type: "var_set",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 0 } },
            },
          },
        },
        {
          kind: "block",
          type: "var_change",
          inputs: {
            VALUE: {
              shadow: { type: "math_number_input", fields: { NUM: 1 } },
            },
          },
        },
        { kind: "block", type: "var_get" },
      ],
    },
    {
      kind: "category",
      name: "Math",
      colour: "270",
      contents: [
        { kind: "block", type: "math_number_input" },
        { kind: "block", type: "math_arithmetic" },
        { kind: "block", type: "math_comparison" },
        { kind: "block", type: "math_logic_op" },
        { kind: "block", type: "math_not" },
        { kind: "block", type: "math_random" },
        { kind: "block", type: "math_function" },
        { kind: "block", type: "math_boolean" },
      ],
    },
    {
      kind: "category",
      name: "Instances",
      colour: "20",
      contents: [
        { kind: "block", type: "instance_create" },
        { kind: "block", type: "instance_destroy" },
      ],
    },
    {
      kind: "category",
      name: "Output",
      colour: "160",
      contents: [
        { kind: "block", type: "output_print" },
        { kind: "block", type: "text_string" },
      ],
    },
  ],
};
