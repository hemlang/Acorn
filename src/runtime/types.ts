/**
 * Core runtime type definitions for the Acorn game engine.
 */

/** Event types that sprite instances can respond to. */
export type EventType =
  | "create"
  | "step"
  | "key_down"
  | "key_pressed"
  | "key_released";

/** A compiled action from the block editor, ready for runtime execution. */
export type BlockAction =
  | { type: "set_x"; value: Expression }
  | { type: "set_y"; value: Expression }
  | { type: "change_x"; value: Expression }
  | { type: "change_y"; value: Expression }
  | { type: "set_direction"; value: Expression }
  | { type: "move_forward"; value: Expression }
  | { type: "if"; condition: Expression; body: BlockAction[] }
  | {
      type: "if_else";
      condition: Expression;
      thenBody: BlockAction[];
      elseBody: BlockAction[];
    }
  | { type: "repeat"; count: Expression; body: BlockAction[] }
  | { type: "while"; condition: Expression; body: BlockAction[] }
  | { type: "set_variable"; name: string; value: Expression }
  | { type: "change_variable"; name: string; value: Expression }
  | { type: "set_visible"; value: Expression }
  | { type: "set_size"; value: Expression }
  | { type: "create_instance"; spriteId: string; x: Expression; y: Expression }
  | { type: "destroy_instance" }
  | { type: "print"; message: Expression }
  | { type: "stop" };

/** An expression that evaluates to a value during runtime. */
export type Expression =
  | { type: "number"; value: number }
  | { type: "string"; value: string }
  | { type: "boolean"; value: boolean }
  | { type: "variable"; name: string }
  | {
      type: "property";
      property: "x" | "y" | "direction" | "speed" | "visible" | "size";
    }
  | {
      type: "arithmetic";
      op: "+" | "-" | "*" | "/" | "%";
      left: Expression;
      right: Expression;
    }
  | {
      type: "comparison";
      op: "==" | "!=" | "<" | ">" | "<=" | ">=";
      left: Expression;
      right: Expression;
    }
  | {
      type: "logic";
      op: "and" | "or";
      left: Expression;
      right: Expression;
    }
  | { type: "not"; operand: Expression }
  | { type: "random"; min: Expression; max: Expression }
  | {
      type: "math_fn";
      fn: "abs" | "round" | "floor" | "ceil" | "sqrt" | "sin" | "cos";
      arg: Expression;
    };

/** A compiled event handler: event type + key (for key events) → actions. */
export interface CompiledHandler {
  event: EventType;
  key?: string;
  actions: BlockAction[];
}

/** All compiled event handlers for a single sprite type. */
export interface CompiledSprite {
  spriteId: string;
  handlers: CompiledHandler[];
}

/** A live game instance during execution. */
export interface GameInstance {
  id: string;
  spriteId: string;
  spriteName: string;
  x: number;
  y: number;
  direction: number;
  speed: number;
  visible: boolean;
  size: number;
  imageIndex: number;
  destroyed: boolean;
  variables: Record<string, number | string | boolean>;
}

/** Full game state passed between the runtime and interpreter each frame. */
export interface GameState {
  instances: GameInstance[];
  roomWidth: number;
  roomHeight: number;
  frame: number;
  /** Instances created during this frame (queued for next frame). */
  pendingCreations: Array<{ spriteId: string; x: number; y: number }>;
}

/** Keyboard state tracked by the input system. */
export interface KeyboardState {
  /** Keys currently held down. */
  held: Set<string>;
  /** Keys pressed this frame (just went down). */
  justPressed: Set<string>;
  /** Keys released this frame (just went up). */
  justReleased: Set<string>;
}
